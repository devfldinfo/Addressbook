/************************************************************
 * SIMPLE CONTACT SYNC + CONTACT FLATTENING
 ************************************************************/

const SPREADSHEET_ID =
  "1bTu20GBp_ccaOpClMe986caiLBXzeSoSKNMa-OxhZ-I";

const SHEET_QRYEXPORT =
  "qryExport";

const SHEET_MEETINGS =
  "qryExportField";

const SHEET_GOOGLECONTACTS =
  "GoogleContacts";

const SHEET_MASTERCONTACTS =
  "MasterContacts";

const SHEET_UPDATESCHEDULE =
  "Update Schedule";

const SHEET_SYNC_VARIABLES =
  "Sync Variables";

const SHEET_DEBUG =
  "Debug";

const SCRIPT_VERSION =
  "DEV - 1.4";

const DEFAULT_MEETING_PREFIX =
  "TMP";

const DEFAULT_COUNTRY_CODE =
  "+27";

function RefreshBatch() {
  // This is a legacy function that must be kept. 
  // There might be users who's triggers are still set on this function
  UpdateContacts();
}

function UpdateContacts(){
  // This is a legacy function that must be kept. 
  // There might be users who's triggers are still set on this function
  InstallSyncSystem();
}
  
/************************************************************
 * WEB APP
 ************************************************************/

function doGet() {

  return HtmlService
    .createHtmlOutputFromFile(
      "Install"
    )
    .setTitle(
      "Contact Sync Installation"
    );
}


/************************************************************
 * WRITE GOOGLE CONTACTS
 ************************************************************/

function WriteGoogleContacts() {

  var ss = null;

  try {

    ss =
      GetUserWorkSpreadsheet();

    DebugLog(
      ss,
      "WriteGoogleContacts started"
    );

    if (
      IsSyncDisabled(
        ss
      )
    ) {

      DebugLog(
        ss,
        "WriteGoogleContacts skipped: Sync Disabled"
      );

      return;
    }

    WriteGoogleContactsCore(
      ss
    );

    DebugLog(
      ss,
      "WriteGoogleContacts completed"
    );

  }
  catch (e) {

    LogErrorSafely(
      ss,
      "WriteGoogleContacts",
      e
    );

    return;
  }
}


function WriteGoogleContactsCore(
  ss
) {

  var syncVariables =
    GetSyncVariablesSheet(
      ss
    );

  //  WriteSyncVariable(
  //    syncVariables,
  //    7,
  //    SCRIPT_VERSION
  //  );

  var sheet =
    GetOrCreateSheet(
      ss,
      SHEET_GOOGLECONTACTS
    );

  sheet.clearContents();

  sheet
    .getRange(
      1,
      1,
      1,
      8
    )
    .setValues([[
      "Surname",
      "Name",
      "Address",
      "Email",
      "Phone Numbers",
      "Notes",
      "UUID",
      "ResourceName"
    ]]);

  DebugLog(
    ss,
    "GoogleContacts sheet prepared"
  );

  var rows = [];

  var pageToken = null;

  do {

    var response =
      People.People.Connections.list(
        "people/me",
        {
          pageSize: 1000,
          pageToken: pageToken,
          personFields:
            "names,addresses,emailAddresses,phoneNumbers,biographies"
        }
      );

    var people =
      response &&
        response.connections
        ? response.connections
        : [];

    for (
      var i = 0;
      i < people.length;
      i++
    ) {

      var person =
        people[i];

      var notes =
        GetPersonNotes(
          person
        );

      /*
       * UUID comes from Notes.
       */
      var uuid =
        ExtractNoteValue(
          notes,
          "UUID"
        );

      if (!uuid) {
        continue;
      }

      /*
       * Name.
       */
      var surname = "";
      var name = "";

      if (
        person.names &&
        person.names.length > 0
      ) {

        surname =
          SafeString(
            person.names[0].familyName
          );

        name =
          SafeString(
            person.names[0].givenName
          );
      }

      /*
       * Addresses.
       */
      var addresses = [];

      if (
        person.addresses &&
        person.addresses.length > 0
      ) {

        for (
          var a = 0;
          a < person.addresses.length;
          a++
        ) {

          var address =
            SafeString(
              person.addresses[a]
                .formattedValue
            );

          if (address) {

            addresses.push(
              address
            );
          }
        }
      }

      var addressText =
        NormalizeAddressText(
          addresses.join("\n")
        );

      /*
       * Emails.
       */
      var emails = [];

      if (
        person.emailAddresses &&
        person.emailAddresses.length > 0
      ) {

        for (
          var e = 0;
          e < person.emailAddresses.length;
          e++
        ) {

          var email =
            SafeString(
              person.emailAddresses[e]
                .value
            );

          if (email) {

            emails.push(
              email
            );
          }
        }
      }

      var emailText =
        NormalizeEmailAddresses(
          emails.join(", ")
        );

      /*
       * Phones.
       */
      var phones = [];

      if (
        person.phoneNumbers &&
        person.phoneNumbers.length > 0
      ) {

        for (
          var p = 0;
          p < person.phoneNumbers.length;
          p++
        ) {

          var phone =
            SafeString(
              person.phoneNumbers[p]
                .value
            );

          if (phone) {

            phones.push(
              phone
            );
          }
        }
      }

      var phoneText =
        NormalizePhoneNumbers(
          phones.join(", ")
        );

      rows.push([
        surname,
        name,
        addressText,
        emailText,
        phoneText,
        notes,
        uuid,
        SafeString(
          person.resourceName
        )
      ]);
    }

    pageToken =
      response
        ? response.nextPageToken
        : null;

  }
  while (pageToken);

  DebugLog(
    ss,
    "Google contacts retrieved: " +
    rows.length
  );

  /*
   * Sort by surname, then name.
   */
  rows.sort(
    function (a, b) {

      var surnameA =
        SafeString(
          a[0]
        ).toLowerCase();

      var surnameB =
        SafeString(
          b[0]
        ).toLowerCase();

      if (
        surnameA <
        surnameB
      ) {
        return -1;
      }

      if (
        surnameA >
        surnameB
      ) {
        return 1;
      }

      var nameA =
        SafeString(
          a[1]
        ).toLowerCase();

      var nameB =
        SafeString(
          b[1]
        ).toLowerCase();

      if (
        nameA <
        nameB
      ) {
        return -1;
      }

      if (
        nameA >
        nameB
      ) {
        return 1;
      }

      return 0;
    }
  );

  /*
   * Write contacts.
   */
  if (
    rows.length > 0
  ) {

    sheet
      .getRange(
        2,
        1,
        rows.length,
        8
      )
      .setValues(
        rows
      );
  }

  /*
   * Update Sync Variables only after the
   * GoogleContacts sheet has been successfully written.
   */
  WriteSyncVariable(
    syncVariables,
    2,
    new Date()
  );

  WriteSyncVariable(
    syncVariables,
    4,
    rows.length
  );

  WriteSyncVariable(
    syncVariables,
    7,
    SCRIPT_VERSION
  );

  DebugLog(
    ss,
    "GoogleContacts written: " +
    rows.length
  );
}


/************************************************************
 * WRITE MASTER CONTACTS
 ************************************************************/

function WriteMasterContacts() {

  var ss = null;

  try {

    ss =
      GetUserWorkSpreadsheet();

    if (
      IsSyncDisabled(
        ss
      )
    ) {

      DebugLog(
        ss,
        "WriteMasterContacts skipped: Sync Disabled"
      );

      return;
    }

    DebugLog(
      ss,
      "WriteMasterContacts started"
    );

/*
 * Refresh qryExport and qryExportField.
 *
 * Update Schedule is preserved when an
 * old workbook is upgraded.
 */
    ss =
      PrepareUserWorkSheet();

    WriteMasterContactsCore(
      ss
    );

    DebugLog(
      ss,
      "WriteMasterContacts completed"
    );

  }
  catch (e) {

    LogErrorSafely(
      ss,
      "WriteMasterContacts",
      e
    );

    return;
  }
}


function WriteMasterContactsCore(
  ss
) {

  var syncVariables =
    GetSyncVariablesSheet(
      ss
    );

  var source =
    ss.getSheetByName(
      SHEET_QRYEXPORT
    );

  if (!source) {

    throw new Error(
      "Sheet not found: " +
      SHEET_QRYEXPORT
    );
  }

  DebugLog(
    ss,
    "Fresh master qryExport available"
  );

  var contacts =
    ss.getSheetByName(
      SHEET_MASTERCONTACTS
    ) ||
    ss.insertSheet(
      SHEET_MASTERCONTACTS
    );

  var selections =
    GetEligibilitySelections(
      ss
    );

  var meetingLookup =
    LoadMeetingLookup(
      ss
    );

  DebugLog(
    ss,
    "Meeting lookup loaded"
  );

  var data =
    source
      .getDataRange()
      .getValues();

  DebugLog(
    ss,
    "Master rows read: " +
    Math.max(
      0,
      data.length - 1
    )
  );

  var output = [[
    "Surname",
    "Name",
    "Address",
    "Email",
    "Phone Numbers",
    "Notes",
    "UUID",
    "Field",
    "Meeting"
  ]];

  for (
    var r = 1;
    r < data.length;
    r++
  ) {

    var row =
      data[r];

    var uuid =
      SafeString(
        row[19]
      );

    if (!uuid) {
      continue;
    }

    var meetings =
      SafeString(
        row[11]
      );

    if (
      !IsFamilyEligible(
        meetings,
        selections,
        meetingLookup
      )
    ) {
      continue;
    }

    var primary =
      GetPrimaryMeeting(
        meetings,
        meetingLookup
      );

    var prefix =
      primary &&
        primary.prefix
        ? primary.prefix
        : SafeString(
          row[13]
        ) ||
        DEFAULT_MEETING_PREFIX;

    var organizationField = "";
    var organizationMeeting = "";

    if (primary) {

      if (primary.field) {

        organizationField =
          prefix +
          "_" +
          primary.field;
      }

      if (primary.meeting) {

        organizationMeeting =
          prefix +
          "_" +
          primary.meeting;
      }
    }

    var countryCode =
      primary &&
        primary.countryCode
        ? primary.countryCode
        : SafeString(
          row[18]
        ) ||
        DEFAULT_COUNTRY_CODE;

    var notes =
      BuildNotesFromRow(
        row,
        uuid,
        primary,
        meetingLookup
      );

    /*
     * Surname:
     * spaces become underscores.
     */
    var surname =
      SafeString(
        row[0]
      ).replace(
        /\s+/g,
        "_"
      );

    /*
     * Names1.
     */
    var names1 =
      ParseNames1(
        row[1]
      );

    /*
     * Names2.
     */
    var names2 =
      ParseNames2(
        row[2]
      );

    /*
     * Emails.
     */
    var emailValues = [];

    var parsedEmail1 =
      ParseEmailValues(
        row[5]
      );

    var parsedEmail2 =
      ParseEmailValues(
        row[13]
      );

    for (
      var e1 = 0;
      e1 < parsedEmail1.length;
      e1++
    ) {

      emailValues.push(
        parsedEmail1[e1]
      );
    }

    for (
      var e2 = 0;
      e2 < parsedEmail2.length;
      e2++
    ) {

      emailValues.push(
        parsedEmail2[e2]
      );
    }

    /*
     * Phones.
     */
    var phoneValues =
      ParsePhoneNumbers(
        row[12]
      );

 /*   DebugLog(
  ss,
  "Phone parsed: raw=[" +
  phoneValues[0].raw +
  "] tag=[" +
  phoneValues[0].tag +
  "]"
); */ 

    var normalizedEmails =
      NormalizeEmailAddresses(
        emailValues
          .map(
            function (e) {
              return e.value;
            }
          )
          .join(", ")
      );

    var normalizedPhones =
      NormalizePhoneNumbers(
        phoneValues
          .map(
            function (p) {
              return p.raw;
            }
          )
          .join(", ")
      );

    /*
     * Names1:
     *
     * First name always created.
     * Additional names need a tag and
     * matching personal email or phone.
     */
    for (
      var n1 = 0;
      n1 < names1.length;
      n1++
    ) {

      var person1 =
        names1[n1];

      if (
        n1 > 0 &&
        !person1.tag
      ) {
        continue;
      }

      if (
        n1 > 0 &&
        !HasTaggedEmail(
          person1.tag,
          emailValues
        ) &&
        !HasTaggedPhone(
          person1.tag,
          phoneValues
        )
      ) {
        continue;
      }

      WriteFlattenedContact(
        output,
        row,
        surname,
        prefix,
        countryCode,
        person1,
        true,
        emailValues,
        phoneValues,
        notes,
        uuid,
        normalizedEmails,
        normalizedPhones,
        organizationField,
        organizationMeeting
      );
    }

    /*
     * Names2:
     *
     * Only create when the tag has matching
     * personal email or phone.
     */
    for (
      var n2 = 0;
      n2 < names2.length;
      n2++
    ) {

      var person2 =
        names2[n2];

      if (!person2.tag) {
        continue;
      }

      if (
        !HasTaggedEmail(
          person2.tag,
          emailValues
        ) &&
        !HasTaggedPhone(
          person2.tag,
          phoneValues
        )
      ) {
        continue;
      }

      WriteFlattenedContact(
        output,
        row,
        surname,
        prefix,
        countryCode,
        person2,
        false,
        emailValues,
        phoneValues,
        notes,
        uuid,
        normalizedEmails,
        normalizedPhones,
        organizationField,
        organizationMeeting
      );
    }
  }

  var header =
    output.shift();

  output.sort(
    function (a, b) {

      var surnameA =
        SafeString(
          a[0]
        ).toLowerCase();

      var surnameB =
        SafeString(
          b[0]
        ).toLowerCase();

      if (
        surnameA <
        surnameB
      ) {
        return -1;
      }

      if (
        surnameA >
        surnameB
      ) {
        return 1;
      }

      var nameA =
        SafeString(
          a[1]
        ).toLowerCase();

      var nameB =
        SafeString(
          b[1]
        ).toLowerCase();

      if (
        nameA <
        nameB
      ) {
        return -1;
      }

      if (
        nameA >
        nameB
      ) {
        return 1;
      }

      return 0;
    }
  );

  output.unshift(
    header
  );

  contacts.clearContents();

  contacts
    .getRange(
      1,
      1,
      output.length,
      output[0].length
    )
    .setValues(
      output
    );

  /*
   * Update Sync Variables only after the
   * MasterContacts sheet has been successfully written.
   */
  WriteSyncVariable(
    syncVariables,
    3,
    new Date()
  );

  WriteSyncVariable(
    syncVariables,
    5,
    output.length - 1
  );

  WriteSyncVariable(
    syncVariables,
    7,
    SCRIPT_VERSION
  );

  DebugLog(
    ss,
    "MasterContacts written: " +
    (output.length - 1)
  );
}


/************************************************************
 * SYNC CONTACTS TO GOOGLE
 ************************************************************/

function SyncContactsToGoogle() {

  var ss = null;

  try {

    ss =
      GetUserWorkSpreadsheet();

    /*
     * Only sync when both snapshots are current
     * for today.
     */
    if (
      !AreMasterAndGoogleCurrentForToday(
        ss
      )
    ) {
      return;
    }

    if (
      IsSyncDisabled(
        ss
      )
    ) {

      DebugLog(
        ss,
        "SyncContactsToGoogle skipped: Sync Disabled"
      );

      return;
    }

    DebugLog(
      ss,
      "SyncContactsToGoogle started"
    );

    SyncContactsToGoogleCore(
      ss
    );

    DebugLog(
      ss,
      "SyncContactsToGoogle completed"
    );

  }
  catch (e) {

    LogErrorSafely(
      ss,
      "SyncContactsToGoogle",
      e
    );

    return;
  }
}


function SyncContactsToGoogleCore(
  ss
) {

  var syncVariables =
    GetSyncVariablesSheet(
      ss
    );

  //  WriteSyncVariable(
  //    syncVariables,
  //    7,
  //    SCRIPT_VERSION
  //  );

  var contactsSheet =
    ss.getSheetByName(
      SHEET_MASTERCONTACTS
    );

  var googleSheet =
    ss.getSheetByName(
      SHEET_GOOGLECONTACTS
    );

  if (!contactsSheet) {

    throw new Error(
      "Sheet not found: " +
      SHEET_MASTERCONTACTS
    );
  }

  if (!googleSheet) {

    throw new Error(
      "Sheet not found: " +
      SHEET_GOOGLECONTACTS
    );
  }

  var contactsData =
    contactsSheet
      .getDataRange()
      .getValues();

  var googleData =
    googleSheet
      .getDataRange()
      .getValues();

  DebugLog(
    ss,
    "Sync input: MasterContacts=" +
    Math.max(
      0,
      contactsData.length - 1
    ) +
    ", GoogleContacts=" +
    Math.max(
      0,
      googleData.length - 1
    )
  );

  /*
   * Build Google lookup by UUID.
   */
  var googleByUuid = {};

  for (
    var g = 1;
    g < googleData.length;
    g++
  ) {

    var googleRow =
      googleData[g];

    var uuid =
      SafeString(
        googleRow[6]
      );

    if (!uuid) {
      continue;
    }

    if (
      !googleByUuid[uuid]
    ) {

      googleByUuid[uuid] = [];
    }

    googleByUuid[uuid].push({

      surname:
        SafeString(
          googleRow[0]
        ),

      name:
        SafeString(
          googleRow[1]
        ),

      address:
        NormalizeAddressText(
          googleRow[2]
        ),

      email:
        NormalizeEmailAddresses(
          googleRow[3]
        ),

      phones:
        NormalizePhoneNumbers(
          googleRow[4]
        ),

      notes:
        SafeString(
          googleRow[5]
        ),

      uuid:
        uuid,

      resourceName:
        SafeString(
          googleRow[7]
        )
    });
  }

  /*
   * Build MasterContacts lookup by UUID.
   */
  var contactsByUuid = {};

  for (
    var r = 1;
    r < contactsData.length;
    r++
  ) {

    var row =
      contactsData[r];

    var uuid =
      SafeString(
        row[6]
      );

    if (!uuid) {
      continue;
    }

    if (
      !contactsByUuid[uuid]
    ) {

      contactsByUuid[uuid] = [];
    }

    contactsByUuid[uuid].push({

      surname:
        SafeString(
          row[0]
        ),

      name:
        SafeString(
          row[1]
        ),

      address:
        NormalizeAddressText(
          row[2]
        ),

      email:
        NormalizeEmailAddresses(
          row[3]
        ),

      phones:
        NormalizePhoneNumbers(
          row[4]
        ),

      notes:
        SafeString(
          row[5]
        ),

      uuid:
        uuid,

      organizationField:
        SafeString(
          row[7]
        ),

      organizationMeeting:
        SafeString(
          row[8]
        )
    });
  }

  /*
   * Determine which UUIDs need to be recreated.
   *
   * Recreate when:
   *
   *   - Google set is missing
   *   - contact count differs
   *   - Modified on Sheet differs
   */
  var uuidsToRecreate = {};

  for (
    var uuid in contactsByUuid
  ) {

    var desired =
      contactsByUuid[
      uuid
      ];

    var existing =
      googleByUuid[
      uuid
      ];

    if (!existing) {

      uuidsToRecreate[
        uuid
      ] = true;

      continue;
    }

    if (
      !AreContactSetsEqual(
        desired,
        existing
      )
    ) {

      uuidsToRecreate[
        uuid
      ] = true;
    }
  }

  DebugLog(
    ss,
    "Contact sets requiring recreation: " +
    Object.keys(
      uuidsToRecreate
    ).length
  );

  /*
   * Find complete orphan UUIDs.
   *
   * These UUIDs exist in GoogleContacts but
   * no longer exist in MasterContacts.
   */
  var orphanUuids = {};

  for (
    var googleUuid in googleByUuid
  ) {

    if (
      !contactsByUuid[googleUuid]
    ) {

      orphanUuids[
        googleUuid
      ] = true;
    }
  }

  DebugLog(
    ss,
    "Completely orphaned UUID sets: " +
    Object.keys(
      orphanUuids
    ).length
  );

  /*
   * CREATE FIRST.
   */
  var createPeople = [];

  for (
    var recreateUuid in uuidsToRecreate
  ) {

    var desiredContacts =
      contactsByUuid[
      recreateUuid
      ];

    for (
      var i = 0;
      i < desiredContacts.length;
      i++
    ) {

      createPeople.push(
        BuildGooglePerson(
          desiredContacts[i]
        )
      );
    }
  }

  BatchCreateGoogleContacts(
    createPeople
  );

  if (
    createPeople.length > 0
  ) {

    DebugLog(
      ss,
      "Contacts created: " +
      createPeople.length
    );
  }

  /*
   * Prepare old resources for deletion.
   */
  var resourcesToDelete = [];

  /*
   * Old versions of recreated sets.
   */
  for (
    var deleteUuid in uuidsToRecreate
  ) {

    var existingContacts =
      googleByUuid[
      deleteUuid
      ];

    if (!existingContacts) {
      continue;
    }

    for (
      var d = 0;
      d < existingContacts.length;
      d++
    ) {

      if (
        existingContacts[d]
          .resourceName
      ) {

        resourcesToDelete.push(
          existingContacts[d]
            .resourceName
        );
      }
    }
  }

  /*
   * Completely orphaned sets.
   */
  for (
    var orphanUuid in orphanUuids
  ) {

    var orphanContacts =
      googleByUuid[
      orphanUuid
      ];

    if (!orphanContacts) {
      continue;
    }

    for (
      var o = 0;
      o < orphanContacts.length;
      o++
    ) {

      if (
        orphanContacts[o]
          .resourceName
      ) {

        resourcesToDelete.push(
          orphanContacts[o]
            .resourceName
        );
      }
    }
  }

  /*
   * Delete old contacts only after all
   * required creates have succeeded.
   */
  if (
    resourcesToDelete.length > 0
  ) {

    BatchDeleteGoogleContacts(
      resourcesToDelete
    );

    DebugLog(
      ss,
      "Old/orphan contacts deleted: " +
      resourcesToDelete.length
    );
  }

  /*
   * Refresh GoogleContacts after a successful sync.
   *
   * This rereads the actual Google contacts so the
   * local GoogleContacts snapshot now represents the
   * newly synchronized state.
   */
  WriteGoogleContactsCore(
    ss
  );

  DebugLog(
    ss,
    "GoogleContacts refreshed after successful sync"
  );

}

/************************************************************
 * SYNC DATE VALIDATION
 ************************************************************/

function AreMasterAndGoogleCurrentForToday(
  ss
) {

  var sheet =
    GetSyncVariablesSheet(
      ss
    );

  var masterDate =
    sheet
      .getRange(
        "B3"
      )
      .getValue();

  var googleDate =
    sheet
      .getRange(
        "B2"
      )
      .getValue();

  if (
    !masterDate ||
    !googleDate
  ) {

    DebugLog(
      ss,
      "Sync skipped: Master or Google contacts have not been written."
    );

    return false;
  }

  var timezone =
    ss.getSpreadsheetTimeZone();

  var today =
    Utilities.formatDate(
      new Date(),
      timezone,
      "yyyy-MM-dd"
    );

  var masterDay =
    Utilities.formatDate(
      new Date(
        masterDate
      ),
      timezone,
      "yyyy-MM-dd"
    );

  var googleDay =
    Utilities.formatDate(
      new Date(
        googleDate
      ),
      timezone,
      "yyyy-MM-dd"
    );

  if (
    masterDay !== today ||
    googleDay !== today
  ) {

    DebugLog(
      ss,
      "Sync skipped: snapshots not current today. " +
      "Master=" +
      masterDay +
      ", Google=" +
      googleDay +
      ", Today=" +
      today
    );

    return false;
  }

  return true;
}


/************************************************************
 * ELIGIBILITY
 ************************************************************/

function GetEligibilitySelections(
  ss
) {

  var sheet =
    ss.getSheetByName(
      SHEET_UPDATESCHEDULE
    );

  if (!sheet) {

    throw new Error(
      "Sheet not found: " +
      SHEET_UPDATESCHEDULE
    );
  }

  var lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {

    return [];
  }

  var values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getValues();

  var result = [];

  for (
    var i = 0;
    i < values.length;
    i++
  ) {

    var value =
      SafeString(
        values[i][0]
      );

    if (value) {

      result.push(
        value
      );
    }
  }

  return result;
}


function IsFamilyEligible(
  meetings,
  selections,
  meetingLookup
) {

  if (
    !selections ||
    selections.length === 0
  ) {

    return false;
  }

  var flattened =
    NormalizeSelectionText(
      BuildEligibilityValue(
        meetings,
        meetingLookup
      )
    );

  if (!flattened) {

    return false;
  }

  for (
    var i = 0;
    i < selections.length;
    i++
  ) {

    var selection =
      NormalizeSelectionText(
        selections[i]
      );

    if (
      selection &&
      flattened.indexOf(
        selection
      ) !== -1
    ) {

      return true;
    }
  }

  return false;
}


function BuildEligibilityValue(
  meetings,
  meetingLookup
) {

  var primary =
    GetPrimaryMeeting(
      meetings,
      meetingLookup
    );

  if (!primary) {

    return "";
  }

  return [
    primary.province,
    primary.field,
    primary.meeting
  ]
    .filter(
      function (value) {
        return (
          value != null &&
          String(
            value
          ).trim() !== ""
        );
      }
    )
    .join(" ");
}


function NormalizeSelectionText(
  value
) {

  if (value == null) {

    return "";
  }

  return String(value)
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


/************************************************************
 * MEETING LOOKUP
 ************************************************************/

function LoadMeetingLookup(
  ss
) {

  var sheet =
    ss.getSheetByName(
      SHEET_MEETINGS
    );

  if (!sheet) {

    throw new Error(
      "Sheet not found: " +
      SHEET_MEETINGS
    );
  }

  var values =
    sheet
      .getDataRange()
      .getValues();

  var map = {};

  for (
    var i = 1;
    i < values.length;
    i++
  ) {

    var meetingName =
      SafeString(
        values[i][2]
      );

    if (!meetingName) {

      continue;
    }

    map[meetingName] = {

      rowIndex:
        i - 1,

      province:
        SafeString(
          values[i][0]
        ),

      field:
        SafeString(
          values[i][1]
        ),

      meeting:
        meetingName,

      conventionData:
        SafeString(
          values[i][12]
        ),

      prefix:
        SafeString(
          values[i][13]
        ),

      countryCode:
        SafeString(
          values[i][18]
        ),

      takesMeeting:
        SafeString(
          values[i][7]
        ),

      meetingTime:
        SafeString(
          values[i][8]
        ),

      meetingHome:
        SafeString(
          values[i][9]
        ),

      fieldModified:
        values[i][27]
    };
  }

  return map;
}


function GetPrimaryMeeting(
  meetings,
  meetingLookup
) {

  if (
    meetings == null ||
    String(
      meetings
    ).trim() === ""
  ) {

    return null;
  }

  var meetingName =
    String(
      meetings
    )
      .split(",")[0]
      .trim();

  if (!meetingName) {

    return null;
  }

  var primary =
    meetingLookup[
    meetingName
    ];

  if (!primary) {

    return {

      rowIndex:
        -1,

      province:
        "",

      field:
        "",

      meeting:
        meetingName,

      prefix:
        DEFAULT_MEETING_PREFIX,

      countryCode:
        DEFAULT_COUNTRY_CODE,

      conventionData:
        "",

      takesMeeting:
        "",

      meetingTime:
        "",

      meetingHome:
        ""
    };
  }

  return primary;
}


function GetMeetingInfo(
  meeting,
  meetingLookup
) {

  var row =
    meetingLookup[
    String(
      meeting
    ).trim()
    ];

  if (!row) {

    return "";
  }

  var result =
    row.meeting;

  if (
    row.meetingTime.length > 0
  ) {

    result +=
      " " +
      row.meetingTime;
  }

  if (
    row.meetingHome.length > 0
  ) {

    result +=
      " @ " +
      row.meetingHome;
  }

  if (
    row.takesMeeting.length > 0
  ) {

    result +=
      " (" +
      row.takesMeeting +
      ")";
  }

  return result;
}


function GetAllMeetingInfo(
  meetings,
  meetingLookup
) {

  if (
    meetings == null ||
    String(
      meetings
    ).trim() === ""
  ) {

    return "";
  }

  var values =
    Utilities.parseCsv(
      String(
        meetings
      ),
      ","
    )[0];

  var result = [];

  for (
    var i = 0;
    i < values.length;
    i++
  ) {

    var meeting =
      String(
        values[i]
      ).trim();

    if (!meeting) {

      continue;
    }

    var info =
      GetMeetingInfo(
        meeting,
        meetingLookup
      );

    if (info) {

      result.push(
        info
      );
    }
  }

  return result.join(
    "\n"
  );
}


/************************************************************
 * NOTES / GOOGLE CONTACT HELPERS
 ************************************************************/

function GetPersonNotes(
  person
) {

  if (
    !person ||
    !person.biographies ||
    !Array.isArray(
      person.biographies
    )
  ) {

    return "";
  }

  for (
    var i = 0;
    i < person.biographies.length;
    i++
  ) {

    if (
      person.biographies[i] &&
      person.biographies[i].value
    ) {

      return String(
        person.biographies[i].value
      );
    }
  }

  return "";
}


function ExtractNoteValue(
  notes,
  label
) {

  if (!notes) {

    return "";
  }

  var escaped =
    label.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  var re =
    new RegExp(
      "(?:^|\\n)" +
      escaped +
      ":?\\s*\\n?([^\\n]*)",
      "i"
    );

  var match =
    String(
      notes
    ).match(
      re
    );

  return match
    ? String(
      match[1]
    ).trim()
    : "";
}


/************************************************************
 * WRITE ONE CANONICAL CONTACT
 ************************************************************/

function WriteFlattenedContact(
  output,
  row,
  surname,
  prefix,
  countryCode,
  person,
  isNames1,
  emailValues,
  phoneValues,
  notes,
  uuid,
  normalizedEmails,
  normalizedPhones,
  organizationField,
  organizationMeeting
) {

  var personEmails =
    GetEmailsForPerson(
      person.tag,
      isNames1,
      emailValues
    );

  var email =
    personEmails.length > 0
      ? NormalizeEmailAddresses(
        personEmails.join(", ")
      )
      : normalizedEmails;

  var personPhones =
    GetPhonesForPerson(
      person.tag,
      isNames1,
      phoneValues
    );

  var phones = [];

  for (
    var i = 0;
    i < personPhones.length;
    i++
  ) {

    var phone =
      BuildCanonicalPhone(
        personPhones[i],
        countryCode
      );

    if (
      phone.value
    ) {

      phones.push(
        phone.value
      );
    }
  }

var phoneText =
  NormalizePhoneNumbers(
    phones.join(", ")
  );

/*  var phoneText =
    phones.length > 0
      ? NormalizePhoneNumbers(
        phones.join(", ")
      )
      : normalizedPhones;
*/
  /*
   * Combine Address + Postal Address + GPS
   * into one field.
   */
  var addressParts = [];

  if (isNames1) {

    var address =
      SafeString(
        row[3]
      );

    var postalAddress =
      SafeString(
        row[4]
      );

    var gps =
      SafeString(
        row[15]
      );

    if (address) {

      addressParts.push(
        address
      );
    }

    if (postalAddress) {

      addressParts.push(
        postalAddress
      );
    }

    if (gps) {

      addressParts.push(
        gps
      );
    }
  }

  var addressText =
    NormalizeAddressText(
      addressParts.join("\n")
    );

  /*
   * Names1 spaces are preserved.
   */
  var name =
    (
      prefix +
      " " +
      ParseFirstName(
        person.name
      )
    ).trim();

  output.push([
    surname,
    name,
    addressText,
    email,
    phoneText,
    notes,
    uuid,
    organizationField,
    organizationMeeting
  ]);
}


/************************************************************
 * BUILD NOTES
 ************************************************************/

function BuildNotesFromRow(
  row,
  uuid,
  primary,
  meetingLookup
) {

  var notes =
    "Family:\n";

  notes +=
    GetFamilyNamesFromRow(
      row
    );

  notes +=
    "\n\n" +
    GetMeetingNotesFromRow(
      row,
      primary,
      meetingLookup
    ).trim();

  var convention =
    GetConvention(
      row[11],
      meetingLookup
    );

  if (
    convention &&
    convention.length > 0
  ) {

    notes +=
      "\n\nConvention:\n" +
      convention;
  }

  notes +=
    "\n\nAccount:\n" +
    Session
      .getEffectiveUser()
      .getEmail();

  notes +=
    "\n\nUpdated on Google:\n" +
    FormatDateForNotes(
      new Date()
    );

  notes +=
    "\n\nModified on Sheet:\n" +
    FormatDateForNotes(
      row[14]
    );

  notes +=
    "\n\nUUID:\n" +
    uuid;

  var fieldModified =
    GetLatestFieldModified(
      row[11],
      meetingLookup
    );

  if (
    fieldModified
  ) {

    notes +=
      "\n\nField Modified:\n" +
      fieldModified;
  }

  notes +=
    "\n\nScript Version: " +
    SCRIPT_VERSION;

  return notes;

}


function GetFamilyNamesFromRow(
  row
) {

  var names = [];

  var names1 =
    StripAllTags(
      row[1]
    );

  names.push(
    names1
  );

  var names2 =
    ParseNames2(
      row[2]
    );

  for (
    var j = 0;
    j < names2.length;
    j++
  ) {

    if (
      names2[j].name
    ) {

      names.push(
        names2[j].name
      );
    }
  }

  return names.join(
    ", "
  );
}


function GetMeetingNotesFromRow(
  row,
  primary,
  meetingLookup
) {

  var tmpNotes = "";

  if (
    primary &&
    primary.rowIndex > -1
  ) {

    tmpNotes =
      "Field:\n";

    tmpNotes +=
      primary.province +
      " - " +
      primary.field;

    tmpNotes +=
      "\n\nMeeting Info:\n";

    tmpNotes +=
      GetAllMeetingInfo(
        row[11],
        meetingLookup
      ).trim();

  }
  else {

    tmpNotes =
      "Meeting not found: " +
      String(
        row[11] == null
          ? ""
          : row[11]
      );
  }

  var tmp1 =
    String(
      row[10] == null
        ? ""
        : row[10]
    ).trim();

  if (
    String(
      row[9] || ""
    ).toUpperCase() === "Y"
  ) {

    tmp1 +=
      "\nElder of the Sun AM meeting";
  }

  var am =
    String(
      row[6] || ""
    ).toUpperCase() === "Y";

  var pm =
    String(
      row[7] || ""
    ).toUpperCase() === "Y";

  var wed =
    String(
      row[8] || ""
    ).toUpperCase() === "Y";

  if (
    am &&
    pm &&
    wed
  ) {

    tmp1 +=
      "\nHost's all meetings";

  }
  else {

    if (am) {

      tmp1 +=
        "\nHost's Sun AM meeting";
    }

    if (pm) {

      tmp1 +=
        "\nHost's Sun PM meeting";
    }

    if (wed) {

      tmp1 +=
        "\nHost's Wed eve meeting";
    }
  }

  if (
    tmp1 &&
    tmp1.trim()
  ) {

    tmpNotes +=
      "\n\nAdditional Meeting Info:\n" +
      tmp1.trim();
  }

  return tmpNotes.trim();
}


/************************************************************
 * NAME PARSING
 ************************************************************/

function ParseNames1(
  names
) {

  var result = [];

  if (!names) {

    return result;
  }

  var parts =
    String(
      names
    ).split(
      /[&,]/
    );

  for (
    var i = 0;
    i < parts.length;
    i++
  ) {

    var raw =
      parts[i].trim();

    if (!raw) {

      continue;
    }

    result.push({

      raw:
        raw,

      name:
        StripAllTags(
          raw
        ),

      tag:
        ExtractLinkTag(
          raw
        )
    });
  }

  return result;
}


function ParseNames2(
  names
) {

  var result = [];

  if (!names) {

    return result;
  }

  var parts =
    String(
      names
    ).split(",");

  for (
    var i = 0;
    i < parts.length;
    i++
  ) {

    var raw =
      parts[i].trim();

    if (!raw) {

      continue;
    }

    result.push({

      raw:
        raw,

      name:
        StripAllTags(
          raw
        ),

      tag:
        ExtractLinkTag(
          raw
        )
    });
  }

  return result;
}


function ParseFirstName(
  name
) {

  return StripAllTags(
    name
  ).trim();
}


function ExtractLinkTag(
  value
) {

  if (
    value == null
  ) {

    return "";
  }

  var match =
    String(
      value
    ).match(
      /<:([^>]+)>/
    );

  if (!match) {

    return "";
  }

  return String(
    match[1]
  ).trim();
}


function StripAllTags(
  value
) {

  if (
    value == null
  ) {

    return "";
  }

  return String(
    value
  )
    .replace(
      /<[^>]*>/g,
      ""
    )
    .trim();
}


/************************************************************
 * EMAIL PARSING
 ************************************************************/

function ParseEmailValues(
  value
) {

  var result = [];

  if (
    value == null ||
    String(
      value
    ).trim() === ""
  ) {

    return result;
  }

  var values =
    Utilities.parseCsv(
      String(
        value
      ),
      ","
    )[0];

  for (
    var i = 0;
    i < values.length;
    i++
  ) {

    var raw =
      String(
        values[i]
      ).trim();

    if (!raw) {

      continue;
    }

    result.push({

      value:
        RemoveEmailTags(
          raw
        ),

      tag:
        ExtractLinkTag(
          raw
        )
    });
  }

  return result;
}


function RemoveEmailTags(
  value
) {

  if (
    value == null
  ) {

    return "";
  }

  return String(
    value
  )
    .replace(
      /<[^>]*>/g,
      ""
    )
    .trim();
}


function GetEmailsForPerson(
  personTag,
  isNames1,
  emailValues
) {

  var result = [];

  for (
    var i = 0;
    i < emailValues.length;
    i++
  ) {

    var email =
      emailValues[i];

    if (email.tag) {

      if (
        personTag &&
        email.tag === personTag
      ) {

        result.push(
          email.value
        );
      }

    }
    else if (
      isNames1
    ) {

      result.push(
        email.value
      );
    }
  }

  return result;
}


function HasTaggedEmail(
  tag,
  emailValues
) {

  if (!tag) {

    return false;
  }

  for (
    var i = 0;
    i < emailValues.length;
    i++
  ) {

    if (
      emailValues[i].tag === tag
    ) {

      return true;
    }
  }

  return false;
}


/************************************************************
 * PHONE PARSING
 ************************************************************/

function ParsePhoneNumbers(
  value
) {

  var result = [];

  if (
    value == null ||
    String(
      value
    ).trim() === ""
  ) {

    return result;
  }

  var values =
    Utilities.parseCsv(
      String(
        value
      ),
      ","
    )[0];

  for (
    var i = 0;
    i < values.length;
    i++
  ) {

    var raw =
      String(
        values[i]
      ).trim();

    if (!raw) {

      continue;
    }

    result.push({

      raw:
        raw,

      tag:
        ExtractLinkTag(
          raw
        )
    });
  }

  return result;
}


function GetPhonesForPerson(
  personTag,
  isNames1,
  phoneValues
) {

  var result = [];

  for (
    var i = 0;
    i < phoneValues.length;
    i++
  ) {

    var phone =
      phoneValues[i];

    if (phone.tag) {

      if (
        personTag &&
        phone.tag === personTag
      ) {

        result.push(
          phone.raw
        );
      }

    }
    else if (
      isNames1
    ) {

      result.push(
        phone.raw
      );
    }
  }

  return result;
}


function HasTaggedPhone(
  tag,
  phoneValues
) {

  if (!tag) {

    return false;
  }

  for (
    var i = 0;
    i < phoneValues.length;
    i++
  ) {

    if (
      phoneValues[i].tag === tag
    ) {

      return true;
    }
  }

  return false;
}


function BuildCanonicalPhone(
  rawNumber,
  countryCode
) {

  return {

    value:
      NormalizePhoneNumber(
        rawNumber,
        countryCode
      ),

    type:
      GetPhoneType(
        rawNumber
      )
  };
}


function GetPhoneType(
  rawNumber
) {

  if (
    rawNumber == null
  ) {

    return "main";
  }

  var value =
    RemovePhoneTags(
      String(
        rawNumber
      )
    ).trim();

  var upper =
    value.toUpperCase();

  if (
    /(?:FAX|H\/F|HOMEFAX|H\/FAX)$/.test(
      upper
    )
  ) {

    return "homeFax";
  }

  if (
    /(?:HOME|H)$/.test(
      upper
    )
  ) {

    return "home";
  }

  if (
    /(?:OFFICE|WORK|WRK|W)$/.test(
      upper
    )
  ) {

    return "work";
  }

  if (
    /^(?:FAX|H\/F|HOMEFAX|H\/FAX)/.test(
      upper
    )
  ) {

    return "homeFax";
  }

  if (
    /^(?:HOME|H)[\s:.-]/.test(
      upper
    )
  ) {

    return "home";
  }

  if (
    /^(?:OFFICE|WORK|WRK|W)[\s:.-]/.test(
      upper
    )
  ) {

    return "work";
  }

  var number =
    RemoveNonNumericPhoneCharacters(
      value
    );

  if (
    number.charAt(0) === "+"
  ) {

    return "mobile";
  }

  if (
    number.charAt(0) === "0" &&
    number.length > 1
  ) {

    var second =
      Number(
        number.charAt(1)
      );

    if (
      second > 5
    ) {

      return "mobile";
    }
  }

  return "main";
}


function RemovePhoneTags(
  value
) {

  if (
    value == null
  ) {

    return "";
  }

  return String(
    value
  )
    .replace(
      /<[^>]*>/g,
      ""
    )
    .trim();
}


function RemoveNonNumericPhoneCharacters(
  value
) {

  if (
    value == null
  ) {

    return "";
  }

  var text =
    String(
      value
    );

  var result = "";
  var hasPlus = false;

  for (
    var i = 0;
    i < text.length;
    i++
  ) {

    var ch =
      text.charAt(i);

    if (
      ch >= "0" &&
      ch <= "9"
    ) {

      result += ch;

    }
    else if (
      ch === "+" &&
      result.length === 0 &&
      !hasPlus
    ) {

      result += ch;

      hasPlus = true;
    }
  }

  return result;
}


function NormalizePhoneNumber(
  aNumber,
  aCountryCode
) {

  if (
    aNumber == null ||
    String(
      aNumber
    ).trim() === ""
  ) {

    return "";
  }

  var raw =
    RemovePhoneTags(
      String(
        aNumber
      )
    ).trim();

  var countryCode =
    String(
      aCountryCode == null
        ? ""
        : aCountryCode
    ).trim();

  if (!countryCode) {

    countryCode =
      DEFAULT_COUNTRY_CODE;
  }

  countryCode =
    RemoveNonNumericPhoneCharacters(
      countryCode
    );

  if (
    countryCode.charAt(0) !== "+"
  ) {

    countryCode =
      "+" +
      countryCode;
  }

  var number =
    RemoveNonNumericPhoneCharacters(
      raw
    );

  if (!number) {

    return "";
  }

  if (
    number.charAt(0) === "+"
  ) {

    number =
      number.substring(1);

  }
  else if (
    number.indexOf("00") === 0
  ) {

    number =
      number.substring(2);

  }
  else if (
    number.charAt(0) === "0"
  ) {

    number =
      number.substring(1);
  }

  if (
    raw.charAt(0) !== "+" &&
    raw.indexOf("00") !== 0
  ) {

    number =
      countryCode.substring(1) +
      number;
  }

  return "+" +
    number;
}


/************************************************************
 * CONVENTION
 ************************************************************/

function GetConvention(
  meetings,
  meetingLookup
) {

  var primary =
    GetPrimaryMeeting(
      meetings,
      meetingLookup
    );

  if (!primary) {

    return "";
  }

  var data =
    primary.conventionData;

  if (!data) {

    return "";
  }

  var match =
    data.match(
      /<[^>]+>([\s\S]*?)<\/[^>]+>/
    );

  if (match) {

    return String(
      match[1]
    ).trim();
  }

  return String(
    data
  ).trim();
}


/************************************************************
 * GENERAL HELPERS
 ************************************************************/

function SafeString(
  value
) {

  return value == null
    ? ""
    : String(
      value
    ).trim();
}


function FormatDateForNotes(
  value
) {

  if (
    value == null ||
    value === ""
  ) {

    return "";
  }

  try {

    return Utilities.formatDate(
      new Date(
        value
      ),
      "GMT+2",
      "dd/MM/yyyy HH:mm:ss"
    );

  }
  catch (e) {

    return String(
      value
    );
  }
}


function GetOrCreateSheet(
  ss,
  name
) {

  var sheet =
    ss.getSheetByName(
      name
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        name
      );
  }

  return sheet;
}


/************************************************************
 * NORMALIZATION
 ************************************************************/

function NormalizeAddressText(
  value
) {

  if (
    value == null ||
    String(
      value
    ).trim() === ""
  ) {

    return "";
  }

  return String(
    value
  )
    .replace(
      /\r\n/g,
      "\n"
    )
    .replace(
      /\r/g,
      "\n"
    )
    .split(
      "\n"
    )
    .map(
      function (line) {
        return SafeString(
          line
        );
      }
    )
    .filter(
      function (line) {
        return line !== "";
      }
    )
    .join(
      "\n"
    );
}


function NormalizePhoneNumbers(
  value
) {

  if (
    value == null ||
    String(
      value
    ).trim() === ""
  ) {

    return "";
  }

  var phones =
    String(
      value
    )
      .split(",")
      .map(
        function (phone) {

          return phone
            .trim()
            .replace(
              /\s+/g,
              ""
            )
            .replace(
              /\([^)]*\)$/g,
              ""
            );
        }
      )
      .filter(
        function (phone) {
          return phone !== "";
        }
      );

  phones =
    phones.filter(
      function (
        phone,
        index
      ) {

        return (
          phones.indexOf(
            phone
          ) === index
        );
      }
    );

  phones.sort();

  return phones.join(
    ", "
  );
}


function NormalizeEmailAddresses(
  value
) {

  if (
    value == null ||
    String(
      value
    ).trim() === ""
  ) {

    return "";
  }

  var emails =
    String(
      value
    )
      .split(",")
      .map(
        function (email) {

          return email
            .trim()
            .toLowerCase();
        }
      )
      .filter(
        function (email) {
          return email !== "";
        }
      );

  emails =
    emails.filter(
      function (
        email,
        index
      ) {

        return (
          emails.indexOf(
            email
          ) === index
        );
      }
    );

  emails.sort();

  return emails.join(
    ", "
  );
}


/************************************************************
 * COMPARE CONTACT SETS
 ************************************************************/
function AreContactSetsEqual(
  desired,
  existing
) {

  /*
   * Number of canonical contacts must equal
   * the number of Google contacts for the UUID.
   */
  if (
    desired.length !==
    existing.length
  ) {

    return false;
  }

  if (
    desired.length === 0
  ) {

    return true;
  }

  /*
   * Compare the family/master Modified on Sheet
   * date.
   */
  var desiredDate =
    GetModifiedOnSheetFromNotes(
      desired[0].notes
    );

  var existingDate =
    GetModifiedOnSheetFromNotes(
      existing[0].notes
    );

  if (
    desiredDate === null ||
    existingDate === null
  ) {

    return false;
  }

  if (
    desiredDate.getTime() !==
    existingDate.getTime()
  ) {

    return false;
  }

  /*
   * Compare the qryExportField modification date.
   *
   * If there is no Field Modified date in the
   * canonical contact, it is deliberately ignored.
   *
   * Therefore a blank AB does NOT cause an
   * unnecessary recreation.
   */
  var desiredFieldDate =
    GetFieldModifiedFromNotes(
      desired[0].notes
    );

  var existingFieldDate =
    GetFieldModifiedFromNotes(
      existing[0].notes
    );

  /*
   * Only compare the field timestamp when the
   * canonical contact has one.
   */
  if (
    desiredFieldDate !== null
  ) {

    if (
      existingFieldDate === null
    ) {

      return false;
    }

    if (
      desiredFieldDate.getTime() !==
      existingFieldDate.getTime()
    ) {

      return false;
    }
  }

  return true;
}

function GetFieldModifiedFromNotes(
  notes
) {

  if (!notes) {

    return null;
  }

  var match =
    String(
      notes
    ).match(
      /(?:^|\n)Field Modified:\s*\n?([^\n]*)/i
    );

  if (!match) {

    return null;
  }

  var value =
    String(
      match[1]
    ).trim();

  /*
   * Expected format:
   *
   * dd/MM/yyyy HH:mm:ss
   */
  var dateMatch =
    value.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
    );

  if (!dateMatch) {

    return null;
  }

  return new Date(
    Date.UTC(
      Number(
        dateMatch[3]
      ),
      Number(
        dateMatch[2]
      ) - 1,
      Number(
        dateMatch[1]
      ),
      Number(
        dateMatch[4]
      ),
      Number(
        dateMatch[5]
      ),
      Number(
        dateMatch[6]
      )
    )
  );
}

function GetModifiedOnSheetFromNotes(
  notes
) {

  if (!notes) {

    return null;
  }

  var match =
    String(
      notes
    ).match(
      /(?:^|\n)Modified on Sheet:\s*\n?([^\n]*)/i
    );

  if (!match) {

    return null;
  }

  var value =
    String(
      match[1]
    ).trim();

  /*
   * Expected format:
   *
   * dd/MM/yyyy HH:mm:ss
   */
  var dateMatch =
    value.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
    );

  if (!dateMatch) {

    return null;
  }

  return new Date(
    Date.UTC(
      Number(
        dateMatch[3]
      ),
      Number(
        dateMatch[2]
      ) - 1,
      Number(
        dateMatch[1]
      ),
      Number(
        dateMatch[4]
      ),
      Number(
        dateMatch[5]
      ),
      Number(
        dateMatch[6]
      )
    )
  );
}


/************************************************************
 * BUILD GOOGLE PERSON
 ************************************************************/

function BuildGooglePerson(
  contact
) {

  var person = {

    names: [{

      givenName:
        contact.name,

      familyName:
        contact.surname
    }],

    biographies: [{

      value:
        contact.notes
    }],

    organizations: [

      {
        name:
          contact.organizationField
      },

      {
        name:
          contact.organizationMeeting
      },

      {
        name:
          "RSA Contacts"
      }
    ]
  };

  /*
   * Email.
   */
  if (
    contact.email
  ) {

    person.emailAddresses = [
      {
        value:
          contact.email
      }
    ];
  }

  /*
   * Phones.
   */
  if (
    contact.phones
  ) {

    var phoneParts =
      NormalizePhoneNumbers(
        contact.phones
      ).split(",");

    var phoneAddresses = [];

    for (
      var i = 0;
      i < phoneParts.length;
      i++
    ) {

      var phone =
        SafeString(
          phoneParts[i]
        );

      if (!phone) {

        continue;
      }

      phoneAddresses.push({

        value:
          phone
      });
    }

    if (
      phoneAddresses.length > 0
    ) {

      person.phoneNumbers =
        phoneAddresses;
    }
  }

  /*
   * Address.
   */
  if (
    contact.address
  ) {

    var addressParts =
      NormalizeAddressText(
        contact.address
      )
        .split(
          "\n"
        );

    person.addresses = [];

    for (
      var a = 0;
      a < addressParts.length;
      a++
    ) {

      if (
        addressParts[a]
      ) {

        person.addresses.push({

          formattedValue:
            addressParts[a],

          type:
            "other"
        });
      }
    }
  }

  return person;
}


/************************************************************
 * BATCH CREATE
 ************************************************************/

function BatchCreateGoogleContacts(
  people
) {

  if (
    !people ||
    people.length === 0
  ) {

    return;
  }

  var BATCH_SIZE =
    200;

  for (
    var start = 0;
    start < people.length;
    start += BATCH_SIZE
  ) {

    var batch =
      people.slice(
        start,
        start + BATCH_SIZE
      );

    var requests = [];

    for (
      var i = 0;
      i < batch.length;
      i++
    ) {

      requests.push({

        contactPerson:
          batch[i]
      });
    }

    try {

      var response =
        People.People.batchCreateContacts({

          contacts:
            requests,

          readMask:
            "names,metadata,biographies,organizations,emailAddresses,phoneNumbers,addresses"
        });

      if (
        !response ||
        !response.createdPeople ||
        response.createdPeople.length !==
        batch.length
      ) {

        throw new Error(
          "Google created " +
          (
            response &&
              response.createdPeople
              ? response.createdPeople.length
              : 0
          ) +
          " of " +
          batch.length +
          " requested contacts."
        );
      }

    }
    catch (e) {

      throw new Error(
        "Batch contact creation failed: " +
        e
      );
    }
  }
}


/************************************************************
 * BATCH DELETE
 ************************************************************/

function BatchDeleteGoogleContacts(
  resourceNames
) {

  if (
    !resourceNames ||
    resourceNames.length === 0
  ) {

    return;
  }

  var unique = [];

  for (
    var i = 0;
    i < resourceNames.length;
    i++
  ) {

    var resourceName =
      SafeString(
        resourceNames[i]
      );

    if (
      resourceName &&
      unique.indexOf(
        resourceName
      ) === -1
    ) {

      unique.push(
        resourceName
      );
    }
  }

  var BATCH_SIZE =
    500;

  for (
    var start = 0;
    start < unique.length;
    start += BATCH_SIZE
  ) {

    var batch =
      unique.slice(
        start,
        start + BATCH_SIZE
      );

    try {

      People.People.batchDeleteContacts({
        resourceNames:
          batch
      });

    }
    catch (e) {

      throw new Error(
        "Batch contact deletion failed: " +
        e
      );
    }
  }
}


/************************************************************
 * SYNC VARIABLES
 ************************************************************/

function GetSyncVariablesSheet(
  ss
) {

  var sheet =
    ss.getSheetByName(
      SHEET_SYNC_VARIABLES
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        SHEET_SYNC_VARIABLES
      );
  }

  sheet
    .getRange(
      1,
      1,
      1,
      2
    )
    .setValues([[
      "Variable",
      "Value"
    ]]);

  sheet
    .getRange(
      2,
      1,
      6,
      1
    )
    .setValues([
      ["Retrieved from Google"],
      ["Retrieved from Master"],
      ["Google Contacts Count"],
      ["Master Count"],
      ["Sync Disabled"],
      ["Script Version"]
    ]);

  return sheet;
}


function IsSyncDisabled(
  ss
) {

  var sheet =
    GetSyncVariablesSheet(
      ss
    );

  return (
    SafeString(
      sheet
        .getRange(
          "B6"
        )
        .getValue()
    ) !== ""
  );
}


function WriteSyncVariable(
  sheet,
  row,
  value
) {

  sheet
    .getRange(
      row,
      2
    )
    .setValue(
      value
    );
}


/************************************************************
 * DEBUG
 ************************************************************/

function GetDebugSheet(
  ss
) {

  var sheet =
    ss.getSheetByName(
      SHEET_DEBUG
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        SHEET_DEBUG
      );

    sheet
      .getRange(
        1,
        1,
        1,
        2
      )
      .setValues([[
        "Date / Time",
        "Debug Information"
      ]]);
  }

  return sheet;
}


function DebugLog(
  ss,
  message
) {

  try {

    var sheet =
      GetDebugSheet(
        ss
      );

    /*
     * Keep a maximum of 2000 debug entries.
     * When 2000 entries are reached, start
     * again at row 2, keeping the header.
     */
    if (
      sheet.getLastRow() >= 2000
    ) {

      sheet
        .getRange(
          2,
          1,
          2000,
          2
        )
        .clearContent();

      sheet
        .getRange(
          2,
          1
        )
        .setValue(
          new Date()
        );

      sheet
        .getRange(
          2,
          2
        )
        .setValue(
          SafeString(
            message
          )
        );

      return;
    }

    sheet.appendRow([
      new Date(),
      SafeString(
        message
      )
    ]);

  }
  catch (e) {

    /*
     * Debugging must never cause
     * the main process to fail.
     */
  }
}

function LogErrorSafely(
  ss,
  functionName,
  error
) {

  var message =
    error &&
      error.message
      ? error.message
      : String(
        error
      );

  if (ss) {

    DebugLog(
      ss,
      "ERROR in " +
      functionName +
      ": " +
      message
    );

    return;
  }

  /*
   * The user workbook may not have been
   * obtainable. Log to the master workbook
   * as a last resort.
   */
  try {

    var master =
      SpreadsheetApp.openById(
        SPREADSHEET_ID
      );

    DebugLog(
      master,
      "ERROR in " +
      functionName +
      ": " +
      message
    );

  }
  catch (ignore) { }
}


/************************************************************
 * USER WORKBOOK
 ************************************************************/

function CreateUserWorkSheet() {

  var email =
    Session
      .getEffectiveUser()
      .getEmail();

  var atPosition =
    email.indexOf("@");

  if (
    atPosition === -1
  ) {

    throw new Error(
      "Unable to determine user email."
    );
  }

  var fileName =
    email.substring(
      0,
      atPosition
    ) +
    " - UpdateSchedule";

  var userSpreadsheet =
    SpreadsheetApp.create(
      fileName
    );

  var file =
    DriveApp.getFileById(
      userSpreadsheet.getId()
    );

  file.setStarred(true);

  file.addEditor("devfldinfo@gmail.com");
  file.addEditor("mariusmarais2008@gmail.com");

  userSpreadsheet
    .setSpreadsheetLocale(
      "en_US"
    );

  /*
   * Keep spreadsheet date/time handling
   * consistent with South Africa.
   */
  userSpreadsheet
    .setSpreadsheetTimeZone(
      "Africa/Johannesburg"
    );

  var masterSpreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

  /*
   * These two sheets are refreshed every
   * time WriteMasterContacts runs.
   */
  var sheetsToRefresh = [
    SHEET_QRYEXPORT,
    SHEET_MEETINGS
  ];

  for (
    var i = 0;
    i < sheetsToRefresh.length;
    i++
  ) {

    var sheetName =
      sheetsToRefresh[i];

    var sourceSheet =
      masterSpreadsheet.getSheetByName(
        sheetName
      );

    if (!sourceSheet) {

      throw new Error(
        "Master sheet not found: " +
        sheetName
      );
    }

    /*
     * Remove previous copy.
     */
    var existingSheet =
      userSpreadsheet.getSheetByName(
        sheetName
      );

    if (existingSheet) {

      userSpreadsheet.deleteSheet(
        existingSheet
      );
    }

    /*
     * Create fresh destination sheet.
     */
    var destinationSheet =
      userSpreadsheet.insertSheet(
        sheetName
      );

    /*
     * Copy VALUES only.
     */
    var values =
      sourceSheet
        .getDataRange()
        .getValues();

    if (
      values.length > 0 &&
      values[0].length > 0
    ) {

      destinationSheet
        .getRange(
          1,
          1,
          values.length,
          values[0].length
        )
        .setValues(
          values
        );

      /*
       * qryExport column M contains phone
       * numbers. Force it to text so values
       * already stored as text remain text.
       */
      if (
        sheetName ===
        SHEET_QRYEXPORT
      ) {

        destinationSheet
          .getRange(
            1,
            13,
            values.length,
            1
          )
          .setNumberFormat(
            "@"
          );
      }
    }
  }

/*
 * Copy the master Update Schedule into
 * the newly-created workbook.
 */

  var sourceUpdateSchedule =
    masterSpreadsheet.getSheetByName(
      SHEET_UPDATESCHEDULE
    );

  if (!sourceUpdateSchedule) {

    throw new Error(
      "Master sheet not found: " +
      SHEET_UPDATESCHEDULE
    );
  }

  var updateScheduleSheet =
    sourceUpdateSchedule.copyTo(
      userSpreadsheet
    );

  updateScheduleSheet.setName(
    SHEET_UPDATESCHEDULE
  );

  /*
   * Remove any blank/default sheet without
   * relying on a localized name such as Sheet1.
   */
  var requiredSheets = [
    SHEET_QRYEXPORT,
    SHEET_MEETINGS,
    SHEET_UPDATESCHEDULE
  ];

  var sheets =
    userSpreadsheet.getSheets();

  for (
    var j = sheets.length - 1;
    j >= 0;
    j--
  ) {

    var currentSheet =
      sheets[j];

    if (
      requiredSheets.indexOf(
        currentSheet.getName()
      ) !== -1
    ) {

      continue;
    }

    if (
      currentSheet.getLastRow() === 0 &&
      currentSheet.getLastColumn() === 0 &&
      userSpreadsheet.getSheets().length > 1
    ) {

      userSpreadsheet.deleteSheet(
        currentSheet
      );
    }
  }

  return userSpreadsheet;
}

function PrepareUserWorkSheet() {

  var email =
    Session
      .getEffectiveUser()
      .getEmail();

  var atPosition =
    email.indexOf("@");

  if (
    atPosition === -1
  ) {

    throw new Error(
      "Unable to determine user email."
    );
  }

  var fileName =
    email.substring(
      0,
      atPosition
    ) +
    " - UpdateSchedule";

  var files =
    DriveApp
      .getRootFolder()
      .getFilesByName(
        fileName
      );

  /*
   * Look for an existing workbook.
   */
  while (
    files.hasNext()
  ) {

    var file =
      files.next();

    if (
      file.getMimeType() ===
      "application/vnd.google-apps.spreadsheet"
    ) {

      var userSpreadsheet =
        SpreadsheetApp.open(
          file
        );

      /*
       * If the old Data sheet exists,
       * this is an old-system workbook.
       */
      if (
        userSpreadsheet.getSheetByName(
          "Data"
        )
      ) {

        return UpgradeUserSpreadsheet(
          file,
          userSpreadsheet
        );
      }

      /*
       * This is already a current-system
       * workbook. Refresh its dynamic sheets.
       */
      return PrepareExistingUserWorkSheet(
        userSpreadsheet);
    }
  }

  /*
   * No workbook exists.
   * Create a new one.
   */
  return CreateUserWorkSheet();
}

function PrepareExistingUserWorkSheet(userSpreadsheet) {

  userSpreadsheet
    .setSpreadsheetLocale(
      "en_US"
    );

  userSpreadsheet
    .setSpreadsheetTimeZone(
      "Africa/Johannesburg"
    );

  var masterSpreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

  /*
   * These sheets are refreshed every
   * time WriteMasterContacts runs.
   */
  var sheetsToRefresh = [
    SHEET_QRYEXPORT,
    SHEET_MEETINGS
  ];

  for (
    var i = 0;
    i < sheetsToRefresh.length;
    i++
  ) {

    var sheetName =
      sheetsToRefresh[i];

    var sourceSheet =
      masterSpreadsheet.getSheetByName(
        sheetName
      );

    if (!sourceSheet) {

      throw new Error(
        "Master sheet not found: " +
        sheetName
      );
    }

    /*
     * Remove previous copy.
     */
    var existingSheet =
      userSpreadsheet.getSheetByName(
        sheetName
      );

    if (existingSheet) {

      userSpreadsheet.deleteSheet(
        existingSheet
      );
    }

    /*
     * Create fresh destination sheet.
     */
    var destinationSheet =
      userSpreadsheet.insertSheet(
        sheetName
      );

    /*
     * Copy VALUES only.
     */
    var values =
      sourceSheet
        .getDataRange()
        .getValues();

    if (
      values.length > 0 &&
      values[0].length > 0
    ) {

      destinationSheet
        .getRange(
          1,
          1,
          values.length,
          values[0].length
        )
        .setValues(
          values
        );

      /*
       * qryExport column M contains phone
       * numbers. Force it to text.
       */
      if (
        sheetName ===
        SHEET_QRYEXPORT
      ) {

        destinationSheet
          .getRange(
            1,
            13,
            values.length,
            1
          )
          .setNumberFormat(
            "@"
          );
      }
    }
  }

  /*
   * Return the existing workbook.
   */
  return userSpreadsheet;
}

function GetUserWorkSpreadsheet() {

  var email =
    Session
      .getEffectiveUser()
      .getEmail();

  var atPosition =
    email.indexOf("@");

  if (
    atPosition === -1
  ) {

    throw new Error(
      "Unable to determine user email."
    );
  }

  var fileName =
    email.substring(
      0,
      atPosition
    ) +
    " - UpdateSchedule";

  var files =
    DriveApp
      .getRootFolder()
      .getFilesByName(
        fileName
      );

  while (
    files.hasNext()
  ) {

    var file =
      files.next();

    if (
      file.getMimeType() ===
      "application/vnd.google-apps.spreadsheet"
    ) {

      return SpreadsheetApp.open(
        file
      );
    }
  }

  InstallSyncSystem();
  //  throw new Error(
  //    "User work spreadsheet not found: " +
  //    fileName
  //  );
}


/************************************************************
 * INSTALLATION
 ************************************************************/

function InstallSyncSystem() {

  var ss = null;

  try {

    /*
     * Create or prepare the user's workbook.
     */
    ss =
      PrepareUserWorkSheet();

    DebugLog(
      ss,
      "Sync installation started"
    );

    /*
     * Get the current logged-in user's
     * Gmail address.
     */
    var gmailAddress =
      Session
        .getActiveUser()
        .getEmail();

    if (!gmailAddress) {

      throw new Error(
        "Unable to determine the current user's email address."
      );
    }

    /*
     * Remove existing sync triggers first.
     */
    var triggers =
      ScriptApp.getProjectTriggers();

    for (
      var i = 0;
      i < triggers.length;
      i++
    ) {

      var handler =
        triggers[i]
          .getHandlerFunction();

      if (
        handler ===
        "WriteMasterContacts" ||
        handler ===
        "WriteGoogleContacts" ||
        handler ===
        "SyncContactsToGoogle" ||
        handler ===
        "RefreshBatch" ||
        handler ===
        "UpdateContacts"
      ) {

        ScriptApp.deleteTrigger(
          triggers[i]
        );
      }
    }

    /*
     * 01:00 - Master
     */
    ScriptApp
      .newTrigger(
        "WriteMasterContacts"
      )
      .timeBased()
      .atHour(1)
      .nearMinute(0)
      .everyDays(1)
      .create();

    /*
     * 02:00 - Google
     */
    ScriptApp
      .newTrigger(
        "WriteGoogleContacts"
      )
      .timeBased()
      .atHour(2)
      .nearMinute(0)
      .everyDays(1)
      .create();

    /*
     * 03:00 - Sync
     */
    ScriptApp
      .newTrigger(
        "SyncContactsToGoogle"
      )
      .timeBased()
      .atHour(3)
      .nearMinute(0)
      .everyDays(1)
      .create();

    DebugLog(
      ss,
      "Sync installation completed: 3 triggers created"
    );

    return {

      success:
        true,

      message:
        "The sync system has been installed successfully."

    };

  }
  catch (e) {

    LogErrorSafely(
      ss,
      "InstallSyncSystem",
      e
    );

    return {

      success:
        false,

      message:
        e.message
    };
  }
}

function GetLatestFieldModified(
  meetings,
  meetingLookup
) {

  if (
    meetings == null ||
    String(meetings).trim() === ""
  ) {

    return "";
  }

  var values =
    Utilities.parseCsv(
      String(meetings),
      ","
    )[0];

  var latest = null;

  for (
    var i = 0;
    i < values.length;
    i++
  ) {

    var meeting =
      String(
        values[i]
      ).trim();

    if (!meeting) {
      continue;
    }

    var row =
      meetingLookup[
      meeting
      ];

    if (
      !row ||
      !row.fieldModified
    ) {
      continue;
    }

    var date =
      new Date(
        row.fieldModified
      );

    if (
      isNaN(
        date.getTime()
      )
    ) {
      continue;
    }

    if (
      !latest ||
      date.getTime() >
      latest.getTime()
    ) {

      latest = date;
    }
  }

  return latest
    ? FormatDateForNotes(
      latest
    )
    : "";
}

function UpgradeUserSpreadsheet(
  oldFile,
  oldSpreadsheet
) {

  var oldSchedule =
    oldSpreadsheet.getSheetByName(
      SHEET_UPDATESCHEDULE
    );

  if (!oldSchedule) {

    throw new Error(
      "Old workbook does not contain " +
      SHEET_UPDATESCHEDULE
    );
  }

  /*
   * Preserve the user's existing
   * Update Schedule.
   */
  var scheduleData =
    oldSchedule
      .getDataRange()
      .getValues();

  /*
   * Create the completely new workbook.
   *
   * IMPORTANT:
   * Use CreateUserWorkSheet(), not
   * PrepareUserWorkSheet(), otherwise
   * the old workbook could be found again.
   */
  var newSpreadsheet =
    CreateUserWorkSheet();

  /*
   * Get the newly-created Update Schedule.
   */
  var newSchedule =
    newSpreadsheet.getSheetByName(
      SHEET_UPDATESCHEDULE
    );

  if (!newSchedule) {

    throw new Error(
      "New workbook does not contain " +
      SHEET_UPDATESCHEDULE
    );
  }

  /*
   * Replace the new schedule with the
   * user's existing schedule.
   */
  newSchedule
    .getRange(
      1,
      1,
      scheduleData.length,
      scheduleData[0].length
    )
    .setValues(
      scheduleData
    );

  /*
   * Only trash the old workbook after
   * the new workbook has been successfully
   * created and populated.
   */
  oldFile.setTrashed(true);

  return newSpreadsheet;
}
