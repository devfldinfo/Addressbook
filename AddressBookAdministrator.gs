gvAfricaWorkerDetailFileID = "1huCv6kfw51xEluxNEndlPeBT6uVrmXO4Tw-YJOHIbw0";
gvAddressbookID = "1bTu20GBp_ccaOpClMe986caiLBXzeSoSKNMa-OxhZ-I";

gvRSAAddressBook = SpreadsheetApp.openById(gvAddressbookID);

// hanneshannes waswas here too

var ss = gvRSAAddressBook;
var sss = ss.getSheets();
var aCheckSheet = null;
var aMeetingSheet = ss.getSheetByName('qryExportField');
var aMtgDataRange = aMeetingSheet.getRange("A1:T744");
var aMtgData = aMtgDataRange.getValues();
var aBusyDev = false;
var gvUpdateSchedule;
var gvUpdateScheduleSheet;

var sDateFormat = "MM/dd/yyyy HH:mm:ss";




function InstallAdministrator() {



  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'SortAllSheets')
      ScriptApp.deleteTrigger(triggers[i]);

    if (triggers[i].getHandlerFunction() == 'onEdit')
      ScriptApp.deleteTrigger(triggers[i]);

    if (triggers[i].getHandlerFunction() == "ClearAllFormatting")
      ScriptApp.deleteTrigger(triggers[i]);

    if (triggers[i].getHandlerFunction() == "CheckAllContacts")
      ScriptApp.deleteTrigger(triggers[i]);

    if (triggers[i].getHandlerFunction() == "ImportWorkersInfo")
      ScriptApp.deleteTrigger(triggers[i]);
  }




  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(gvRSAAddressBook)
    .onEdit()
    .create();

  var newT = ScriptApp.newTrigger("SortAllSheets")
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .create();

  var newT = ScriptApp.newTrigger("CheckAllContacts")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();




  var newT = ScriptApp.newTrigger("ClearAllFormatting")
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(0)
    .create();

  var newT = ScriptApp.newTrigger("ImportWorkersInfo")
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();


}






function CheckAllContacts() {

  if (aBusyDev)
    return

  var AllData = GetAllData();

  GetUpdateScheduleSheetCheckData();
  aCheckSheet.clear();

  CheckData(AllData);

  EmailResults();
}





function ClearAllFormatting() {

  for (var i = 2; i < gvRSAAddressBook.getNumSheets(); i++) {
    var sheet = gvRSAAddressBook.getSheets()[i];

    sheet.clearFormats();
  }
}





function SortAllSheets() {
  var sheets = gvRSAAddressBook.getSheets();

  var sc = sheets.length - 3;

  var Fieldsheet = sheets[1]; //Marius was here 6 October 2025 - Fixed bug that was sorting the qryExport sheet instead of the qryExportField. 

  // 17 June 2025 - hannes was here. made it more generic by not specifying the numbers

  //  var FieldRange = Fieldsheet.getRange("A2:S700");
  var FieldRange = Fieldsheet.getRange("A:S");
  FieldRange.sort([{ column: 1, ascending: true }, { column: 2, ascending: true }, { column: 3, ascending: true }]);

  for (var i = 4; (i < sc); ++i) {
    var sheet = sheets[i];

    //    var range = sheet.getRange("A2:U1000");
    var range = sheet.getRange("A:U");
    var s = sheet.getName();
    // Sorts by meeting, then ascending by surname then by name;

    range.sort([{ column: 1, ascending: true }, { column: 2, ascending: true }]);
  }
}














///////////////////////////
//backup rsa addressbook
//////////////////





var cAmountOfDaysToKeepBackups = 30;
var cBackupName = 'Backup - RSA Address Book';
var cMonthlyBackupName = 'Monthly Backup - RSA Address Book';
var cBackupFolderName = 'Backups - RSA Address Book';


var unionmeeting = "0B-oqrUzf5f6gc2ZjN0Jia0swNWc"
var convention = "0B-oqrUzf5f6gYS1NcVlZbE1yUFU"
var durban2018specialmeeting = "1q2wXt8naDCRLqlO1Q691GEAbgxjFAwQ_"
var workdocs = "0B-oqrUzf5f6gNjV4eE1MREIxSjg"
var prints = "0B610AIQfgYv6elZtYXdmX1VPS0k";
var archive = "1GDRtqYDtihFld8t87fOGkHV5c_zvdxXD";

var scriptproperties = PropertiesService.getScriptProperties();
var d = " - " + Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd HH-mm-ss");
var tt = false;
var fid = "H";



function BackupDocs() {
  var topFolder = DriveApp.getFolderById(prints)
  deletekeys();
  getFolders_(topFolder.getName(), topFolder);


}

function findRootFolder() {
  var folderId = prints;
  var mustb = "y"
  if (mustb != "y")
    return

  //var folderId = convention;
  var folderId = folderId.toString().trim();
  var start = new Date();

  try {

    var topFolder = DriveApp.getFolderById(folderId);

    deletekeys();
    // spreadsheet.toast("Copy Process Has Started. Please Wait...", "Started", -1);
    getFolders_(topFolder.getName(), topFolder);
    //  spreadsheet.toast("Folder Has Been Copied Successfully. Please Check Your Google Drive Now.", "Success", -1);

    if (d != "") {
      var fol = DriveApp.getFolderById(fid);
      fol.isTrashed(true);
    }

  } catch (e) {
    Browser.msgBox("Error", "Sorry, Error Occured: " + e.toString(), Browser.Buttons.OK);
    // spreadsheet.toast("Error Occurred :( Please make sure you Entered Folder ID in B5 Cell.", "Oops!", -1);
  }

}

function getFolders_(path, container) {

  var folders = container.getFolders();

  var count = 0;
  while (folders.hasNext()) {
    count++;
    var folder = folders.next();
  }

  var folderCount = count;
  var fileslist = container.getFiles();
  var fileCountFind = 0;
  while (fileslist.hasNext()) {
    fileCountFind++;
    var file = fileslist.next();
    Logger.log(file.getName());
  }
  var fileCount = fileCountFind;
  var files = container.getFiles();

  Logger.log("container.getName() " + container.getName() + "| folder length " + folderCount + "| files length " + fileCount);

  if (folderCount <= 0) {

    if (fileCount > 0) {
      Logger.log("Just Files Found Loop");
      copyfiles_(container.getName(), files);
    }
  }

  if (folderCount) {
    Logger.log("If loop, Folders Found");
    var folders = container.getFolders();

    while (folders.hasNext()) {

      var folder = folders.next();
      copy_(container.getName(), folder.getName(), files);
      var thisFolder = folder.getName();
      var thisPath = path + "/" + thisFolder;
      Logger.log("Folder Name:" + folder.getName());
      getFolders_(thisPath, folder);

    }

  }
  return;
}

function copy_(containername, childname, files) {

  if (scriptproperties.getProperty(containername + "copy")) {
    Logger.log("if");
    var parentcontainer = DriveApp.getFolderById(scriptproperties.getProperty(containername + "copy"));

    if (!scriptproperties.getProperty(containername + "processed")) {
      /*process, copy files*/

      while (files.hasNext()) {
        var file = files.next();
        if (fileUpdated(file)) {


          var newFile = file.makeCopy(file.getName(), parentcontainer);
          //parentcontainer.addFile(newFile);
          DriveApp.getRootFolder().removeFile(newFile);
          Utilities.sleep(500);
        }
      }




    }

    scriptproperties.setProperty(containername + "processed", "true");
    var childfolder = parentcontainer.createFolder(childname + d);
    if (d != "")
      fid = childfolder.getId();
    var childfolderid = childfolder.getId();
    d = "";
    scriptproperties.setProperty(childname + "copy", childfolderid);

  } else {

    Logger.log("else");
    var parentfold = DriveApp.createFolder(containername + d);
    var parentfoldid = parentfold.getId();
    if (d != "")
      fid = parentfoldid;
    scriptproperties.setProperty(containername + "copy", parentfoldid);



    if (!scriptproperties.getProperty(containername + "processed")) {
      /*process, copy files*/

      while (files.hasNext()) {
        var file = files.next();
        if (fileUpdated(file)) {
          var newFile = file.makeCopy(file.getName(), parentfold);
          //  parentfold.addFile(newFile);
          DriveApp.getRootFolder().removeFile(newFile);
          Utilities.sleep(500);
        }
      }

    }

    scriptproperties.setProperty(containername + "processed", "true");
    var childfolder = parentfold.createFolder(childname + d);
    var childfolderid = childfolder.getId();
    if (d != "")
      fid = childfolderid;
    scriptproperties.setProperty(childname + "copy", childfolderid);

  }
  Logger.log("Container Name: " + containername + "||" + " Child Name: " + childname);
}

function fileUpdated(file) {
  var r = false;
  var dr = 0;
  var nd = new Date();
  var lu = file.getLastUpdated();
  dr = nd - lu;
  var mili = 1000;
  var s = 60 * mili;
  var min = 60 * s;
  var h = 60 * min;

  r = dr < h;
  if (r)
    tt = true;
  return r;

}

function copyfiles_(containername, files) {
  if (scriptproperties.getProperty(containername + "copy")) {
    Logger.log("If Loop, Just files found- down");
    var parentcontainer = DriveApp.getFolderById(scriptproperties.getProperty(containername + "copy"));

    if (!scriptproperties.getProperty(containername + "processed")) {

      while (files.hasNext()) {
        var file = files.next();
        if (fileUpdated(file)) {
          var newFile = file.makeCopy(file.getName(), parentcontainer);
          //parentcontainer.addFile(newFile);
          DriveApp.getRootFolder().removeFile(newFile);
          Utilities.sleep(500);
        }
      }
    }
    scriptproperties.setProperty(containername + "processed", "true");

  } else {

    Logger.log("Else Loop, Just files found");
    var ar = DriveApp.getFolderById(archive);
    var parentfold = ar.createFolder(containername + d);
    var parentfoldid = parentfold.getId();
    scriptproperties.setProperty(containername + "copy", parentfoldid);

    if (!scriptproperties.getProperty(containername + "processed")) {

      while (files.hasNext()) {
        var file = files.next();
        if (fileUpdated(file)) {
          var newFile = file.makeCopy(file.getName(), parentfold);
          //parentfold.addFile(newFile);
          DriveApp.getRootFolder().removeFile(newFile);
          Utilities.sleep(500);
        }
      }



    }
    scriptproperties.setProperty(containername + "processed", "true");
  }

}

function deletekeys() {
  scriptproperties.deleteAllProperties();
}

function dounzip() {
  // var id = 1LUa2dTWEFO_ukKPc5JZBvK9JCj_LQRR3
  var id = "0B-oqrUzf5f6geHhUckQzMXRpeTB5TmFmZ3JXU2VENnRpcFk0";



  var zip = DriveApp.getFileById(id).getBlob();
  zip.setContentType("application/zip");

  // This now unzips the blobs
  var files = Utilities.unzip(zip);

  var newDriveFile = DriveApp.createFile(files[0]);
  Logger.log(newDriveFile.getId())




}

function MakeXLSCopy() {

  var files = DriveApp.searchFiles('title contains "Import.xlsx"');
  if (files.hasNext()) {
    var file = files.next();
    // if (file != null)
    file.setTrashed(true);
  }


  var addressbookid = "1bTu20GBp_ccaOpClMe986caiLBXzeSoSKNMa-OxhZ-I";




  var url = "https://docs.google.com/feeds/download/spreadsheets/Export?key=" + addressbookid + "&exportFormat=xlsx";

  var params = {
    method: "get",
    headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };


  var blob = UrlFetchApp.fetch(url, params).getBlob();
  blob.setName("Import" + ".xlsx");

  f = DriveApp.createFile(blob);



}

function BackupAddressBook() {
return;
  var l = LockService.getPublicLock();
  if (l.tryLock(60000)) {
    var IsFinished = false;
    var count = 0;
    while (!IsFinished) {
      try {
        //        var addressbookid = "1bTu20GBp_ccaOpClMe986caiLBXzeSoSKNMa-OxhZ-I";
        var ss = gvRSAAddressBook;
        if (ss == null)
          return;


        var BackupFile = ss.copy(cBackupName + ' - ' + Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd HH-mm-ss"))
        IsFinished = true;
      }
      catch (e) {
        Utilities.sleep(3000);
        count = count + 1;
        if (count > 10)
          IsFinished = true;
      }
    }


    var BackupFolders = DriveApp.getFoldersByName(cBackupFolderName);
    var BackupFolder = null;

    if (BackupFolders.hasNext())
      BackupFolder = BackupFolders.next();
    else
      BackupFolder = DriveApp.createFolder(cBackupFolderName);

    if (BackupFile != null) {
      BackupFolder.addFile(DriveApp.getFileById(BackupFile.getId()));
      DriveApp.getRootFolder().removeFile(DriveApp.getFileById(BackupFile.getId()));
    }
    CreateMonthlyBackup(BackupFolder)
    DeleteOldBackups(BackupFolder);
  }
}

function DeleteOldBackups(BackupFolder) {

  //var files = DriveApp.getFiles();
  var files = BackupFolder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var f = file.getName();

    if (f.indexOf(cMonthlyBackupName) > -1)
      continue;

    if (f.indexOf(cBackupName) > -1) {
      var dc = file.getDateCreated();

      if (dc.valueOf() < new Date().valueOf() - (cAmountOfDaysToKeepBackups * 24 * 60 * 60 * 1000))
      //     if (dc.valueOf() < new Date().valueOf()-(1000*60*1)) // 1 minute
      {
        file.setTrashed(true);

      }
    }
  }
}


function CreateMonthlyBackup(BackupFolder) {

  var aYear = Utilities.formatDate(new Date(), "GMT+2", "y");
  var aMonth = Utilities.formatDate(new Date(), "GMT+2", "MM");
  var tmpFileName = cMonthlyBackupName + " - " + aYear + "-" + aMonth;
  var files = BackupFolder.getFilesByName(tmpFileName);

  if (!files.hasNext()) {
    var MonthBackupFile = SpreadsheetApp.getActiveSpreadsheet().copy(tmpFileName);
    BackupFolder.addFile(DriveApp.getFileById(MonthBackupFile.getId()));
    DriveApp.getRootFolder().removeFile(DriveApp.getFileById(MonthBackupFile.getId()));

  }
}

function MakePDFCopy() {




  var files = DriveApp.searchFiles('title contains "pdfAfricaWorkerDetailsTMP.pdf"');
  if (files.hasNext()) {
    var file = files.next();
    // if (file != null)
    file.setTrashed(true);
  }


  var awdid = "1huCv6kfw51xEluxNEndlPeBT6uVrmXO4Tw-YJOHIbw0";


  var url = "https://docs.google.com/feeds/download/spreadsheets/Export?key=" + awdid + "&exportFormat=pdf";




  var params = {
    method: "get",
    headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };


  var blob = UrlFetchApp.fetch(url, params).getBlob();
  blob.setName("pdfAfricaWorkerDetailsTMP.pdf");

  f = DriveApp.createFile(blob);



}




//////////////////////////////////////
// checkdata
///////////////////


function CheckAllContactsDev() {
  aBusyDev = false;
  CheckAllContacts();
}



function EmailResults() {

  var dataRange = aCheckSheet.getRange("A1:A200");
  var data = dataRange.getValues();
  var d = '';
  d = data[1][0];

  if (d.length > 1)
    MailApp.sendEmail("rsaaddressbookchanges@gmail.com", "Address Book Data Check", data);

}




function CheckData(data) {

  for (var i = 0; (i < data.length - 1); ++i) {
    var row = data[i];

    var tmpSurname = row[0];
    var tmpNames1 = row[1];
    var tmpNames2 = row[2];
    var tmpEmail = row[5];
    var tmpMTG = row[11];
    var tmpNumbers = row[12];
    var tmpID = row[19];
    var tmpModDate = row[14];


    tmpNames1 = tmpNames1.replace("&", ",");
    var aNames = tmpNames1 + ', ' + tmpNames2;

    aNames = Utilities.parseCsv(aNames, ',')[0];

    // Check Duplicate IDs
    var IDExists = ID_Exist(data, tmpID);
    if (IDExists)
      LogMsg('\nDuplicate ID: ' + tmpMTG + ' ***** ' + tmpSurname + ' ' + aNames + ' -> ' + tmpID);

    // Check Meetings
    var MtgsNotFound = CheckMeetings(aMtgData, tmpMTG, tmpModDate, tmpID);
    if (MtgsNotFound.length > 0)
      LogMsg('\nMeeting not found: ' + tmpSurname + ' -> ' + aNames + ' -> ' + MtgsNotFound + '\n');


    var aNumbers = Utilities.parseCsv(tmpNumbers, ',')[0];
    var aEmails = Utilities.parseCsv(tmpEmail, ',')[0];
    var aNumbersAndEmails = Utilities.parseCsv(tmpNumbers + ", " + tmpEmail, ',')[0]

    //Check if Name Prefixes appear in Numbers and Emails
    CheckPrefixes(aNames, aNumbersAndEmails, "Prefix not found in Numbers or Emails: " + tmpMTG + ' **** ' + tmpSurname + ' ' + aNames);
    //Check if Number Prefixes appear in Names
    CheckPrefixes(aNumbers, aNames, "Phone Prefix not found in Names: " + tmpMTG + ' **** ' + tmpSurname + ' ' + aNames);
    //Check if Email Prefixes appear in Names
    CheckPrefixes(aEmails, aNames, "Email Prefix not found in Names: " + tmpMTG + ' **** ' + tmpSurname + ' ' + aNames);

  }


}

function ExtractPrefix(aName) {
  var tmpstr = aName + "..";
  var i = tmpstr.indexOf("<:");
  if (i > 0) {
    tmpstr = tmpstr.substr(i, tmpstr.indexOf(">", i) - i + 1);
    return tmpstr.replace(' ', '');
  }
  else
    return "";
}


function CheckPrefixes(aPrefixes, aData, aMSG) {
  if (aPrefixes == null)
    return;
  if (aData == null)
    return;

  aData = aData.toString();
  var tmpPrefix = "";
  var tmpIndex = 0;

  for (var i = 0; i < aPrefixes.length; ++i) {
    tmpPrefix = ExtractPrefix(aPrefixes[i]);
    if (tmpPrefix != "") {
      tmpIndex = aData.indexOf(tmpPrefix);
      if (tmpIndex == -1)
        LogMsg(aMSG + " ->" + aPrefixes[i]);
    }
  }


}



function CheckMeetings(aMeetingData, aMeetings, aModDate, aContactID) {

  var tmpMeetings = Utilities.parseCsv(aMeetings, ",");
  var tmpMeeting1 = "";
  var tmpMeeting2 = "";
  var tmpNotFound = "";
  var adostamp = false;

  if (aMeetings.trim() == "")
    return "";

  try {
    var a = tmpMeetings[0].length;
  }
  catch (e) {
    tmpMeetings = Utilities.parseCsv(aMeetings.concat(", "), ",");
    a = tmpMeetings[0].length;

  }


  for (var ii = 0; ii < a; ++ii) {
    tmpMeeting1 = tmpMeetings[0][ii];
    var afound = false;

    for (var i = 1; i < aMeetingData.length; ++i) {
      //  adostamp = false;
      tmpMeeting2 = aMeetingData[i][2];
      if (tmpMeeting1.trim() == tmpMeeting2.trim()) {
        /*    try{
            if((typeof(aMeetingData[i][19])!="undefined")&&(typeof(aModDate) != "undefined"))
              if (aMeetingData[i][19].getTime()>aModDate.getTime())
              {
             //   var txtFinder =ss.createTextFinder(aContactID);
              //  var txtRange = txtFinder.findAll()[0];
             //   var aModCell = txtRange.offset(0,-5);
                 adostamp = true;            
              }
              }
              catch(e)
              {
                adostamp = true;
              }
              
              if (adostamp)
              {
                var txtFinder =ss.createTextFinder(aContactID);
                var txtRange = txtFinder.findAll()[0];
                var aModCell = txtRange.offset(0,-5);
                aModCell.setValue(Utilities.formatDate(new Date(), "GMT+2",sDateFormat ));      
              }
            */
        afound = true;
        break;
      }
    }
    if (!afound)
      tmpNotFound = tmpNotFound.concat(tmpMeeting1);

  }
  return tmpNotFound;
}


//
//
//

function GetUpdateScheduleSheetCheckData() {
  var aFileName = Session.getEffectiveUser().getEmail();

  aFileName = aFileName.substr(0, aFileName.indexOf("@")) + " - UpdateSchedule";

  var files = DriveApp.getRootFolder().getFilesByName(aFileName);

  var aFound = false;
  var temp;

  while (files.hasNext()) {
    var afile = files.next();
    var amimetype = afile.getMimeType();

    if (amimetype == "application/vnd.google-apps.spreadsheet") {
      gvUpdateSchedule = SpreadsheetApp.open(afile);

      gvUpdateScheduleSheet = gvUpdateSchedule.getSheetByName("CheckContacts");

      if (gvUpdateScheduleSheet == null) {
        // insert here 
        gvUpdateScheduleSheet = gvUpdateSchedule.insertSheet('CheckContacts')

      }

      //   afile.addEditor("devfldinfo@gmail.com");

      aFound = true;
    }
  }

  if (!aFound) {
    gvUpdateSchedule = SpreadsheetApp.create(aFileName)
    var afile = DriveApp.getFileById(gvUpdateSchedule.getId());

    afile.setStarred(true);

    afile.addEditor("devfldinfo@gmail.com");

    gvUpdateScheduleSheet = gvUpdateSchedule.insertSheet('CheckContacts')

  }
  aCheckSheet = gvUpdateScheduleSheet;

}

//
//


function GetAllData() {
  // Copy all the different Province Data to the user's Data sheet in the user's Update Schedule Google Sheet
  var aKZNData = ss.getSheetByName("KwaZulu - Natal").getRange("A2:U700").getValues();
  var aWCData = ss.getSheetByName("Western Cape").getRange("A2:U700").getValues();
  var aFSData = ss.getSheetByName("Vrystaat").getRange("A2:U700").getValues();
  var aZIMData = ss.getSheetByName("Zimbabwe").getRange("A2:U700").getValues();
  var aECData = ss.getSheetByName("Eastern Cape").getRange("A2:U700").getValues();
  var aOTData = ss.getSheetByName("Other").getRange("A2:U700").getValues();
  var aNPData = ss.getSheetByName("Northern Provinces").getRange("A2:U700").getValues();
  var aWKRData = ss.getSheetByName("Africa Workers").getRange("A2:U700").getValues();
  var aVWKRData = ss.getSheetByName("Visiting Workers").getRange("A2:U700").getValues();

  var AllData = aWKRData.concat(aWCData.concat(aFSData.concat(aZIMData.concat(aECData.concat(aOTData.concat(aNPData.concat(aKZNData.concat(aVWKRData))))))));
  return AllData;


}

function ID_Exist(data, ID) {
  if (ID.trim() == "")
    return;

  var counter = 0;
  for (var i = 0; (i < data.length - 1); ++i) {
    var row = data[i];

    var tmpSurname = row[0];
    var tmpName = row[1];
    var tmpID = row[19];
    try {
      if (tmpID == ID) {
        counter = counter + 1
        if (counter > 1)
          return true;
      }
    }
    catch (e) {
    }

  }
  return false;

}

function LogMsg(aMsg) {
  var lastrow = aCheckSheet.getLastRow() + 2;
  var r = aCheckSheet.getRange("A" + lastrow);
  r.setValue(aMsg + '\n \n');


}




//////////////////////////////////////////
///elders
//////////////////////////////////////////////

/*
ToDoList
1. maybe remove meeting info. it makes it to bulky
*/

// 30-10-2018 Marius: Fixed spelling error in email.
var cFirstSheet = 5
//var cFirstSheet = 6
var cNumberOfColumns = 22
var cNumberOfSheets = 7
//var cNumberOfSheets = 10
var cNumberOfEmailsPerExecution = 25;



var ss = gvRSAAddressBook;
var aElderFieldSheet = null;
var aElderFieldSheetdataRange = null;
var workeremaildatarangevalues = null;



function Export() {


  var ups = GetUpdateScheduleSheet();
  aElderFieldSheet = ups.getSheetByName("ElderField");
  if (aElderFieldSheet == null)
    aElderFieldSheet = ups.insertSheet("ElderField");
  aElderFieldSheetdataRange = aElderFieldSheet.getRange("A2:R700");
  workeremaildatarangevalues = aElderFieldSheetdataRange.getValues();

  var asheet = ups.getSheetByName('Elders');

  if (asheet == null)
    asheet = ups.insertSheet("Elders");

  var aLastNumberRange = asheet.getRange("Z1");
  var aLastNumber = aLastNumberRange.getValue();

  if (aLastNumber == "") {
    PrepareContactsExportSheet(ss, ups);
  }

  aElderFieldSheetdataRange = aElderFieldSheet.getRange("A2:R700");
  // hannes was here
  // had to comment this line oout
  // 7 may 2022
  //  workeremaildatarangevalues = aElderFieldSheetdataRange.getValues();

  SendInfo(ups);

  aLastNumber = aLastNumberRange.getValue();
  if (aLastNumber == "") {
    ClearAllContactsInExportSheet(ups);
  }
}

function PrepareContactsExportSheet(ss, ups) {

  ClearAllContactsInExportSheet(ups);
  CopyAllContactsIntoExportSheet(ss, ups);
  SetConvention(ups);
  SortSheet(ups);
  RemoveAllTags(ups);

}

function RemoveAllTags(ups) {

  var asheet = ups.getSheetByName('Elders');
  var range = asheet.getRange("A1:U3000");
  var data = range.getValues();

  for (var i = 0; i < 2999; i++) {
    var mrow = data[i];

    var aNames1 = mrow[1];
    var aNames2 = mrow[2];

    while (aNames1.indexOf("<NC>") > 0)
      aNames1 = aNames1.replace('<NC>', '');
    while (aNames1.indexOf("<NP>") > 0)
      aNames1 = aNames1.replace('<NP>', '');
    mrow[1] = aNames1;

    while (aNames2.indexOf("<NC>") > 0)
      aNames2 = aNames2.replace('<NC>', '');
    while (aNames2.indexOf("<NP>") > 0)
      aNames2 = aNames2.replace('<NP>', '');
    mrow[2] = aNames2;

  }
  range.setValues(data);

}

function SortSheet(ups) {
  var asheet = ups.getSheetByName('Elders');
  var range = asheet.getRange("A1:U3000");
  range.clearFormat();

  // Sorts by meeting, then ascending by surname then by name;

  range.sort([{ column: 15, ascending: true }, { column: 12, ascending: true }, { column: 1, ascending: true }, { column: 2, ascending: true }]);

  range.setWrap(true);

}

function ClearAllContactsInExportSheet(ups) {
  var asheet = ups.getSheetByName('Elders');
  var ln = asheet.getRange("Z1").getValue();
  asheet.clear();
  asheet.getRange("Z1").setValue(ln);



}

function SendInfo(ups) {

  var ff = DriveApp.getFilesByName("tmp");
  while (ff.hasNext()) {
    var f = ff.next();
    f.setTrashed(true);
  }

  var ssc = SpreadsheetApp.create("tmp");

  var asheet = ups.getSheetByName('Elders');

  var aLastNumberRange = asheet.getRange("Z1");
  var aLastNumber = aLastNumberRange.getValue();

  if (aLastNumber == "")
    aLastNumber = 1;

  var range = asheet.getRange("A1:U3000");

  var oldmtg = "";
  var sr = aLastNumber;
  var er = 1;
  var aSent = 0;

  var MeetingData = workeremaildatarangevalues;

  var data = range.getValues();
  for (var i = aLastNumber; i < 3000; i++) {
    var mrow = data[i];
    var aMtg = mrow[11];


    if (aMtg.indexOf(",") > -1) {
      aMtg = aMtg.substr(0, aMtg.indexOf(","))
    }
    if (aMtg.indexOf("Admin -") > -1) {
      sr = i + 2;
      continue;
    }

    if (oldmtg == "")
      oldmtg = aMtg;


    if (aMtg != oldmtg) {

      er = i;

      var tmpEmail = getWorkerEmail(ups, oldmtg);
      if (tmpEmail.trim() == '') {
        oldmtg = aMtg;
        sr = i + 1;

        continue;
        //  tmpEmail = "hannes.marais2007@gmail.com" 
      }

      var rr = "A" + sr + ":M" + er;
      var range2 = asheet.getRange(rr);

      var asheetc = ups.getSheetByName('Checklist');
      if (asheetc == null)
        asheetc = ups.insertSheet("Checklist");

      var rc = asheetc.getRange("A4:M300");
      rc.clear();
      var rc = asheetc.getRange("A4:M4");

      range2.copyTo(rc);
      var ns = asheetc.copyTo(ssc);
      ns.setName(oldmtg);


      if (ssc.getSheets().length > 1) {
        ssc.deleteSheet(ssc.getSheets()[0]);
      }

      try {
        var sscn = ssc.copy(oldmtg);
      }
      catch (e) {
        var sscn = ssc.copy(oldmtg);
      }

      getGoogleSpreadsheetAsExcel(ups, sscn, oldmtg, tmpEmail);

      DriveApp.getFileById(sscn.getId()).setTrashed(true);

      ssc.getSheets()[0].clear();
      oldmtg = aMtg;
      sr = i + 1;
      aSent = aSent + 1;
      if (aSent >= cNumberOfEmailsPerExecution) {
        aLastNumberRange.setValue(i + 1);
        break;
      }
    }

  }
  if (i > 2999) {
    aLastNumberRange.setValue(3000);

  }
  DriveApp.getFileById(ssc.getId()).setTrashed(true);

}


function CopyAllContactsIntoExportSheet(ss, ups) {


  var aNewDataSheet = ups.getSheetByName("Elders");
  if (aNewDataSheet == null) {
    aNewDataSheet = ups.insertSheet("Elders");
    aNewDataSheet.insertRows(1, 7000);
  }
  else
    aNewDataSheet.clear();

  var aTmpSht = ups.getSheetByName("ElderField");
  if (aTmpSht != null)
    ups.deleteSheet(aTmpSht);

  var aQryExportFieldSheet = ss.getSheetByName("qryExportField");
  aTmpSht = aQryExportFieldSheet.copyTo(ups);
  aTmpSht.setName("ElderField");

  var aKZNData = ss.getSheetByName("KwaZulu - Natal").getRange("A2:U1000").getValues();
  var aWCData = ss.getSheetByName("Western Cape").getRange("A2:U1000").getValues();
  var aFSData = ss.getSheetByName("Vrystaat").getRange("A2:U1000").getValues();
  var aZIMData = ss.getSheetByName("Zimbabwe").getRange("A2:U1000").getValues();
  var aECData = ss.getSheetByName("Eastern Cape").getRange("A2:U1000").getValues();
  var aOTData = ss.getSheetByName("Other").getRange("A2:U1000").getValues();
  var aNPData = ss.getSheetByName("Northern Provinces").getRange("A2:U1000").getValues();
  var aWKRData = ss.getSheetByName("Africa Workers").getRange("A2:U700").getValues();
  var aVWKRData = ss.getSheetByName("Visiting Workers").getRange("A2:U700").getValues();

  var AllData = aKZNData.concat(aWCData.concat(aFSData.concat(aZIMData.concat(aECData.concat(aOTData.concat(aNPData.concat(aWKRData.concat(aVWKRData))))))));
  var anr = aNewDataSheet.getRange(1, 1, AllData.length, 21);

  anr.setValues(AllData);
  anr.sort([{ column: 15, ascending: false }, { column: 1, ascending: true }]);
  //  aNewDataSheet.sort(15,false);


  return aNewDataSheet;
}




function SetConvention(ups) {

  var asheet = ups.getSheetByName('Elders');

  var range = asheet.getRange("A1:O3000");


  var MeetingData = workeremaildatarangevalues;

  var data = range.getValues();
  for (var i = 1; i < 3000; i++) {
    var mrow = data[i];
    var aMtg = mrow[11];
    mrow[14] = GetConvention(MeetingData, aMtg);
  }
  range.setValues(data);

}

function getGoogleSpreadsheetAsExcel(ups, ff, aMtg, tmpEmail) {

  try {


    // var ssn = SpreadsheetApp.openById(addressbookid);

    var url = "https://docs.google.com/feeds/download/spreadsheets/Export?key=" + ff.getId() + "&exportFormat=xlsx";

    var params = {
      method: "get",
      headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    };

    var blob = UrlFetchApp.fetch(url, params).getBlob();
    blob.setName(ff.getName() + ".xlsx");

    var email = getWorkerEmail(ups, aMtg);
    //var email = tmpEmail;
    email = email;
    // If ready, uncomment next line and comment out the following line    
    MailApp.sendEmail(email, "Address Book for - " + aMtg, "We have attached the spreadsheet containing the information for the " + aMtg + " meeting. We will appreciate it if you could forward it to the elder to verify the information or verify it yourself, and then send the changes back to rsaaddressbookchanges@gmail.com before the end of November, please. Regards, Address Book Team", { attachments: [blob] });
    //MailApp.sendEmail("hannes.marais2007@gmail.com", email + "TESTING - Address Book for - "+aMtg, "We have attached the spreadsheet containing the information for the "+aMtg+" meeting. We will appreaciate it if you could forward it to the elder to verify the information or verify it yourself, and then send the changes back to rsaaddressbookchanges@gmail.com before the end of November. Regards, Address Book Team", {attachments: [blob]});
    Utilities.sleep(1000);
  } catch (f) {
    var er = f.toString();
    Logger.log(er);
  }
}




function GetConvention(aMeetingData, aMeetings) {
  var tmpConv = "";
  var tmpMeetingRow = GetMeetingRow(aMeetingData, aMeetings);

  if (tmpMeetingRow > -1) {
    tmpConv = aMeetingData[tmpMeetingRow][1];
    // if (tmpConv != null)
    //  tmpConv = tmpConv.substr(tmpConv.indexOf(">")+1,tmpConv.indexOf("</")-tmpConv.indexOf(">")-1);
  }

  return tmpConv;
};

function GetIsSent(aMeetingData, aMeetings) {
  var tmpIsSent = "";
  var aIsSent = false;
  var tmpMeetingRow = GetMeetingRow(aMeetingData, aMeetings);

  if (tmpMeetingRow > -1) {
    tmpIsSent = aMeetingData[tmpMeetingRow][14];
    aIsSent = tmpIsSent != null;
  }

  return aIsSent;
};


function GetMeetingRow(aMeetingData, aMeetings) {
  try {
    if (aMeetings == "")
      return;

    var tmpMeetings = Utilities.parseCsv(aMeetings, ",");
    var tmpSunAM = tmpMeetings[0][0];
    var tmpMeeting = "";
    var tmpRow = -1;

    for (var i = 1; i < aMeetingData.length; ++i) {
      tmpMeeting = aMeetingData[i][2];
      if (tmpMeeting == tmpSunAM) {
        tmpRow = i;
      }
    }
  }
  catch (e) { }
  return tmpRow;
}


function getWorkerField(ss, amtg) {


  for (var i = 0; (i < workeremaildatarangevalues.length - 1); ++i) {


    var row = workeremaildatarangevalues[i];
    var aField = row[1];
    var tmpMtg = row[2];

    if (tmpMtg == amtg) {
      return aField;
    }
  }
  return "";

}

function getWorkerEmail(ss, amtg) {

  var aMasterField = getWorkerField(ss, amtg);



  for (var i = 0; (i < workeremaildatarangevalues.length); ++i) {


    var row = workeremaildatarangevalues[i];
    var aField = row[1];
    var aEmail = row[15].trim();
    var aEmail2 = row[17];

    var cEmail = "";
    if ((aField == aMasterField) && (aEmail != "")) {
      if (aEmail != "")
        cEmail = aEmail;

      if (aEmail2 != "")
        cEmail = cEmail + ", " + aEmail2;

      return cEmail;
    }

  }


  return "";

}

function GetUpdateScheduleSheet() {
  var aFileName = Session.getEffectiveUser().getEmail();

  aFileName = aFileName.substr(0, aFileName.indexOf("@")) + " - UpdateSchedule";

  var files = DriveApp.getRootFolder().getFilesByName(aFileName);

  if (files.hasNext()) {
    var afile = files.next();

    var AUpdateSpreadSheet = SpreadsheetApp.open(afile);


    var ablanksheet = AUpdateSpreadSheet.getSheetByName('Sheet1');

    if (ablanksheet != null)
      AUpdateSpreadSheet.deleteSheet(ablanksheet);
  }
  else {
    var AUpdateSpreadSheet = SpreadsheetApp.create(aFileName)
    var afile = DriveApp.getFileById(AUpdateSpreadSheet.getId());

    afile.setStarred(true);

    afile.setOwner("devfldinfo@gmail.com")

    var d = AUpdateSpreadSheet.insertSheet('Debug');

    d.insertRows(1, 1000);

    var ablanksheet = AUpdateSpreadSheet.getSheetByName('Sheet1');

    if (ablanksheet != null)
      AUpdateSpreadSheet.deleteSheet(ablanksheet);
  }
  return AUpdateSpreadSheet;
}






//////////////////////////////////////
//friends phone list
/////////////////////////////////////////////

/*
ToDoList
1. take workers
*/

var cFirstSheet = 5
//var cFirstSheet = 6
var cNumberOfColumns = 22
var cNumberOfSheets = 42
//var cNumberOfSheets = 10
var cNumberOfEmailsPerExecution = 20;


function Export() {

  var ss = gvRSAAddressBook;

  var asheet = ss.getSheetByName('Elders');

  var aLastNumberRange = asheet.getRange("Z1");
  var aLastNumber = aLastNumberRange.getValue();

  if (aLastNumber == "") {
    PrepareContactsExportSheet(ss);
  }

  SendInfo(ss);

  aLastNumber = aLastNumberRange.getValue();
  if (aLastNumber == "") {
    ClearAllContactsInExportSheet(ss);
  }
}

function PrepareContactsExportSheet(ss) {

  ClearAllContactsInExportSheet(ss);
  CopyAllContactsIntoExportSheet(ss);
  SetField(ss);
  SortSheet(ss);
  RemoveAllTags(ss);

}

function RemoveAllTags(ss) {

  var asheet = ss.getSheetByName('Elders');
  var range = asheet.getRange("A1:U3000");
  var data = range.getValues();

  for (var i = 0; i < 2999; i++) {
    var mrow = data[i];

    var aNames1 = mrow[1];
    var aNames2 = mrow[2];

    while (aNames1.indexOf("<NC>") > 0)
      aNames1 = aNames1.replace('<NC>', '');
    while (aNames1.indexOf("<NP>") > 0)
      aNames1 = aNames1.replace('<NP>', '');
    mrow[1] = aNames1;

    while (aNames2.indexOf("<NC>") > 0)
      aNames2 = aNames2.replace('<NC>', '');
    while (aNames2.indexOf("<NP>") > 0)
      aNames2 = aNames2.replace('<NP>', '');
    mrow[2] = aNames2;

  }
  range.setValues(data);

}

function SortSheet(ss) {
  var asheet = ss.getSheetByName('Elders');
  var range = asheet.getRange("A2:U3000");
  range.clearFormat();

  // Sorts by meeting, then ascending by surname then by name;

  range.sort([{ column: 15, ascending: true }, { column: 1, ascending: true }, { column: 2, ascending: true }]);

  range.setWrap(true);

}

function ClearAllContactsInExportSheet(ss) {
  var asheet = ss.getSheetByName('Elders');
  var ln = asheet.getRange("Z1").getValue();
  asheet.clear();
  asheet.getRange("Z1").setValue(ln);



}

function SendInfo(ss) {

  var ssc = SpreadsheetApp.create("tmp");

  var asheet = ss.getSheetByName('Elders');

  var aLastNumberRange = asheet.getRange("Z1");
  var aLastNumber = aLastNumberRange.getValue();

  if (aLastNumber == "")
    aLastNumber = 1;

  var range = asheet.getRange("A1:U3000");

  var oldmtg = "";
  var sr = aLastNumber;
  var er = 1;
  var aSent = 0;

  var MeetingSheet = ss.getSheetByName("qryExportField");
  var MeetingDataRange = MeetingSheet.getRange("A1:O600");
  var MeetingData = MeetingDataRange.getValues();

  var data = range.getValues();
  for (var i = aLastNumber; i < 3000; i++) {
    var mrow = data[i];
    var aMtg = mrow[14];


    if (aMtg.indexOf(",") > -1) {
      aMtg = aMtg.substr(0, aMtg.indexOf(","))
    }
    if (aMtg.indexOf("Admin -") > -1) {
      sr = i + 2;
      continue;
    }
    if (oldmtg == "")
      oldmtg = aMtg;


    if (aMtg != oldmtg) {
      er = i;

      var rr = "A" + sr + ":M" + er;
      var range2 = asheet.getRange(rr);


      var asheetc = ss.getSheetByName('Empty');
      var rc = asheetc.getRange("A2:M1000");
      rc.clear();
      var rc = asheetc.getRange("A2:M2");

      range2.copyTo(rc);
      var ns = asheetc.copyTo(ssc);
      ns.setName(oldmtg);


      if (ssc.getSheets().length > 1) {
        ssc.deleteSheet(ssc.getSheets()[0]);
      }

      try {
        var sscn = ssc.copy(oldmtg);
      }
      catch (e) {
        var sscn = ssc.copy(oldmtg);
      }

      var aaa = sscn.getSheets()[0];
      aaa.deleteColumns(4, 8);

      getGoogleSpreadsheetAsExcel(sscn, oldmtg);

      DriveApp.getFileById(sscn.getId()).setTrashed(true);

      ssc.getSheets()[0].clear();
      oldmtg = aMtg;
      sr = i + 1;
      aSent = aSent + 1;
      if (aSent >= cNumberOfEmailsPerExecution) {
        aLastNumberRange.setValue(i + 1);
        break;
      }
    }

  }
  if (i == 3000) {
    aLastNumberRange.setValue("");

  }
  DriveApp.getFileById(ssc.getId()).setTrashed(true);

}


function CopyAllContactsIntoExportSheet(ss) {

  var sss = ss.getSheets();
  var qryExportSheet = ss.getSheetByName('Elders');
  var aSheet = ss.getSheetByName('Elders');
  var iii = 1;

  for (var ii = cFirstSheet; ii <= cFirstSheet + cNumberOfSheets; ii++) {
    aSheet = sss[ii];
    if (ii == cFirstSheet)
      iii = 1
    else
      iii = 2
    var rangeToCopy = aSheet.getRange(iii, 1, aSheet.getMaxRows(), cNumberOfColumns);

    rangeToCopy.copyTo(qryExportSheet.getRange(qryExportSheet.getLastRow() + 1, 1));

  }

}


function SetField(ss) {

  var asheet = ss.getSheetByName('Elders');

  var range = asheet.getRange("A1:O3000");


  var MeetingSheet = ss.getSheetByName("qryExportField");
  var MeetingDataRange = MeetingSheet.getRange("A1:M600");
  var MeetingData = MeetingDataRange.getValues();

  var data = range.getValues();
  for (var i = 1; i < 3000; i++) {
    var mrow = data[i];
    var aMtg = mrow[11];
    mrow[14] = GetField(MeetingData, aMtg);
  }
  range.setValues(data);

}

function getGoogleSpreadsheetAsExcel(ss, aMtg) {

  try {


    var ssn = gvRSAAddressBook;

    var url = "https://docs.google.com/feeds/download/spreadsheets/Export?key=" + ss.getId() + "&exportFormat=pdf";

    var params = {
      method: "get",
      headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    };

    var blob = UrlFetchApp.fetch(url, params).getBlob();
    blob.setName(ss.getName() + ".pdf");

    var email = getWorkerEmail(ssn, aMtg);

    // If ready, uncomment next line and comment out the following line    
    //    MailApp.sendEmail(email, "Address Book for - "+aMtg, "We have attached the spreadsheet containing the information for the "+aMtg+" meeting. We will appreaciate it if you could forward it to the elder to verify the information or verify it yourself, and then send the changes back to rsaaddressbookchanges@gmail.com. Regards, Address Book Team", {attachments: [blob]});
    MailApp.sendEmail("hannes.marais2007@gmail.com", email + " - Address Book for - " + aMtg, "We have attached the spreadsheet containing the information for the " + aMtg + " meeting. We will appreaciate it if you could forward it to the elder to verify the information or verify it yourself, and then send the changes back to rsaaddressbookchanges@gmail.com. Regards, Address Book Team", { attachments: [blob] });

  } catch (f) {
    var er = f.toString();
    Logger.log(er);
  }
}




function GetField(aMeetingData, aMeetings) {
  var tmpConv = "";
  var tmpMeetingRow = GetMeetingRow(aMeetingData, aMeetings);

  if (tmpMeetingRow > -1) {
    tmpConv = aMeetingData[tmpMeetingRow][1];
  }

  return tmpConv;
};

function GetIsSent(aMeetingData, aMeetings) {
  var tmpIsSent = "";
  var aIsSent = false;
  var tmpMeetingRow = GetMeetingRow(aMeetingData, aMeetings);

  if (tmpMeetingRow > -1) {
    tmpIsSent = aMeetingData[tmpMeetingRow][14];
    aIsSent = tmpIsSent != null;
  }

  return aIsSent;
};

function SetIsSent(ss, aMeetingData, aMeetings) {
  var tmpMeetingRow = GetMeetingRow(aMeetingData, aMeetings);

  if (tmpMeetingRow > -1) {
    var qMeetingSheet = ss.getSheetByName("qryExportField");
    var qMeetingDataRange = qMeetingSheet.getRange("O" + tmpMeetingRow);
    qMeetingDataRange.setValue("y");
  }

};

function GetMeetingRow(aMeetingData, aMeetings) {
  try {
    if (aMeetings == "")
      return;

    var tmpMeetings = Utilities.parseCsv(aMeetings, ",");
    var tmpSunAM = tmpMeetings[0][0];
    var tmpMeeting = "";
    var tmpRow = -1;

    for (var i = 1; i < aMeetingData.length; ++i) {
      tmpMeeting = aMeetingData[i][2];
      if (tmpMeeting == tmpSunAM) {
        tmpRow = i;
      }
    }
  }
  catch (e) { }
  return tmpRow;
}


function getWorkerField(ss, amtg) {

  var aMailSheet = ss.getSheets()[0];
  var dataRange = aMailSheet.getRange("A2:C1000");
  var data = dataRange.getValues();


  for (var i = 0; (i < data.length - 1); ++i) {


    var row = data[i];
    var aField = row[1];
    var tmpMtg = row[2];

    if (tmpMtg == amtg) {
      return aField;
    }
  }
  return "";

}

function getWorkerEmail(ss, amtg) {

  var aMasterField = getWorkerField(ss, amtg);

  var aMailSheet = ss.getSheetByName("Send Email");
  var dataRange = aMailSheet.getRange("A2:H200");
  var data = dataRange.getValues();


  for (var i = 0; (i < data.length - 1); ++i) {


    var row = data[i];
    var aField = row[4];
    var aEmail = row[1];

    if (aField == aMasterField) {
      return aEmail;
    }

  }


  return "";

}





//////////////////////////////////////////////
// generate random updates
/////////////////////////////////////////////

function myFunction() {
  return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("qryExport");

  var number1 = Math.floor(Math.random() * 2000) + 2;
  var dataRange = sheet.getRange("A" + number1 + ":O" + number1);
  var data = dataRange.getValues();
  var row = data[0];
  row[14] = new Date();
  dataRange.setValues(data);

  MailApp.sendEmail("scripts1.rsaaddressbook@gmail.com", row[0] + " " + row[1], row[2] + ", " + row[3]);

}







//////////////////////////////////////////
// import africa worker details
//////////////////////////////////////////

//var gvAfricaWorkerDetailFileID = '1huCv6kfw51xEluxNEndlPeBT6uVrmXO4Tw-YJOHIbw0';

function ImportWorkersInfo() {
  return;
  var aAfricaWorkerDetails = SpreadsheetApp.openById(gvAfricaWorkerDetailFileID);
  var sheet = aAfricaWorkerDetails.getSheetByName('Latest - edit on this sheet');

  var aColumn = sheet.getRange('L2');
  var rc = aColumn.getValue();

  var aLastRow = sheet.getLastRow() + 1;
  var dataRange = sheet.getRange("A3:J" + aLastRow);
  var data = dataRange.getValues();

  var aRSA_AddressBook = gvRSAAddressBook;
  var dd = Utilities.formatDate(new Date(), "GMT+2", "dd");
  var hh = Utilities.formatDate(new Date(), "GMT+2", "k");


  var aRSA_Sheet = aRSA_AddressBook.getSheetByName('Africa Workers');
  var aRSA_DataRange = aRSA_Sheet.getRange("A2:U200");
  aRSA_DataRange.clear();
  var aRSA_Data = aRSA_DataRange.getValues();
  aRSA_DataRange.clear();

  for (var i = 0; (i < data.length - 1); ++i) {
    var row = data[i];
    var RSA_Row = aRSA_Data[i];
    var aSurn = row[0].trim();
    if (aSurn == '')
      continue;
    var aName = row[1].trim();

    RSA_Row[0] = row[0];//Surname
    RSA_Row[1] = row[1];//Name

    try {
      var tmpTel = row[2].trim();

      var tmp = row[3].trim();
      if (tmp.length > 0)
        tmpTel = tmpTel.concat(', '.concat(tmp));

      tmp = row[5].trim();
      if (tmp.length > 0)
        tmpTel = tmpTel.concat(', '.concat(tmp));
    }
    catch (e) { }

    RSA_Row[12] = tmpTel;
    RSA_Row[11] = 'Worker';

    RSA_Row[5] = row[4];//Email

    var tmp1 = 'Date of Birth: ';
    var tmp2000 = '';
    tmp2000 = row[6];

    if (tmp2000 != '') {
      //tmp1 = tmp1.concat("Age: " + GetAge(tmp2000)+", " ) ;
      tmp1 = tmp1.concat(Utilities.formatDate(new Date(tmp2000), "GMT+8", "E, dd MMM yyyy"));
      // the date conversion does not work so well.
      // sometImes it adds a day.
      // quick fix.... :) 


    }
    else
      tmp1 = tmp1.concat("Unknown");

    var tmp2 = ', Started in Work: ';

    var tmp2000 = '';
    tmp2000 = row[7];

    if (tmp2000 != '') {
      tmp2 = tmp2.concat(row[7]);
    }
    else
      tmp2 = tmp2.concat("Unknown");

    var tmp3 = ', List: ';
    tmp3 = tmp3.concat(row[8]);

    RSA_Row[3] = tmp1.concat(tmp2.concat(tmp3));//DOB, SIW, List

    try {
      var tmp4 = Utilities.formatDate(new Date(row[9]), "GMT+2", "E, dd MMM yyyy");
      RSA_Row[14] = row[9];//Modified Date
    }
    catch (e) {
    }

    var aNewID = Utilities.getUuid();
    var aNewID = aName + aSurn;

    RSA_Row[19] = aNewID;

  }
  aRSA_DataRange.setValues(aRSA_Data);

}

function GetAge(d1) {
  var t2 = new Date().getTime();
  var t1 = d1.getTime();

  return parseInt((t2 - t1) / (24 * 3600 * 1000 * 365.25));
}






///////////////////////////////////
// maintenace
///////////////////////////////

// It is recommended that this script is run under the devfldinfo account

function DisableSync() {
  DisableEnableSync("Y")
}

function EnableSync() {
  DisableEnableSync("")
}

function DisableEnableSync(avalue) {
  SetSyncVariable(avalue, "B14")
}

function StartUpgrade() {
  SetSyncVariable("Y", "B10")
  SetSyncVariable("1", "B11")
  //  SetSyncVariable("0", "B5") // updating row
}

function CancelUpgrade() {
  SetSyncVariable("08/10/2020", "B3")
  SetSyncVariable("0", "B4")
}



function SetLastUpdateDate() {
  var aNewDate = new date - (365 * 20); //20 years
  SetSyncVariable(aNewDate, "B4")
}

function SetMachineTime() {
  SetSyncVariable(60 * 30, "B5")
}



function SetSyncVariable(avalue, cellrange) {

  var aFileName = " - UpdateSchedule";

  var files = DriveApp.getRootFolder().getFiles();

  while (files.hasNext()) {
    var afile = files.next();
    var aname = afile.getName();
    if (aname.indexOf(aFileName) > 0) {

      var tmpUpdateSchedule = SpreadsheetApp.open(afile);
      var tmpSyncVarSheet = null;
      tmpSyncVarSheet = tmpUpdateSchedule.getSheetByName("Sync Variables");

      if (tmpSyncVarSheet != null)
        tmpSyncVarSheet.getRange(cellrange).setValue(avalue);
    }
  }

}



function InitSyncVariable() {

  var aFileName = " - UpdateSchedule";

  var files = DriveApp.getRootFolder().getFiles();

  while (files.hasNext()) {
    var afile = files.next();
    var aname = afile.getName();
    if (aname.indexOf(aFileName) > 0) {

      var tmpUpdateSchedule = SpreadsheetApp.open(afile);
      var tmpSyncVarSheet = null;
      tmpSyncVarSheet = tmpUpdateSchedule.getSheetByName("Sync Variables");

      if (tmpSyncVarSheet != null) {
        tmpSyncVarSheet.getRange("a1:b40").clear();

        var tmpRange = tmpSyncVarSheet.getRange("A1:b15");
        var tmpData = tmpRange.getValues();

        tmpData[0][0] = "Variable";
        tmpData[1][0] = "Cleanup Counter";
        tmpData[2][0] = "Latest Update Date";
        tmpData[3][0] = "Updating Row";
        tmpData[4][0] = "Computer Time";
        tmpData[5][0] = "Sync Disabled";
        tmpData[5][1] = "Y";
        tmpData[6][0] = "Duplicate Removal Count";
        tmpData[7][0] = "Corrupt Notes Counter";
        tmpData[8][0] = "Contacts Version Count";
        tmpData[9][0] = "Contacts Version Difference Found";
        tmpData[10][0] = "All Contact Names1";
        tmpData[11][0] = "All Contact Names2";

        tmpRange.setValues(tmpData);



      }
    }
  }

}

function MailDashboard() {

  var aFileName = "Administrator Dashboard - RSA Address Book";
  var aID = '1eH5_38JXacAOvSqiDx0xBTWVKYZFcVdjIy770rhGGjg';

  var url = "https://docs.google.com/feeds/download/spreadsheets/Export?key=" + aID + "&exportFormat=xlsx";

  var params = {
    method: "get",
    headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };

  var now = new Date();
  var tmp = Utilities.formatDate(now, "GM+2", "dd MMM YYYY") + ' - ';

  var blob = UrlFetchApp.fetch(url, params).getBlob();
  blob.setName(aFileName + ".xlsx");

  var fs = DriveApp.getFilesByName(aFileName + ".xlsx");
  while (fs.hasNext()) {
    var f = fs.next();
    if (f.getName() == aFileName + ".xlsx")
      f.setTrashed(true);
  }

  DriveApp.createFile(blob);

}








///////////////////////////////////////
// make gps map
///////////////////////////////////////////

var gc = 1;
var gr = 1;
var aUpdateSchedulesheetname = "Update Schedule";

function domap() {

  var ds = GetUpdateScheduleSheetgps();
  var rr = 'A200:X400';
  var data = ds.getRange(rr).getValues();
  // var data = ds.getRange('A343:X965').getValues();

  var hh = data.length;
  var corners = [];
  var oldd = "";
  var map = Maps.newStaticMap()
  map.setSize(5000, 5000);


  for (var i = 0; i < hh; i++) {
    var row = data[i];
    var am = row[9].trim();
    var mtg = row[11].trim();
    var gps = row[15].trim();
    var address = row[3].trim();


    if (i == hh - 1)
      mtg = ""

    if (oldd != mtg) {
      CreateMap(map, corners, getnextcolour());
      corners = [];
      oldd = mtg;
    }

    if (gps != '')
      corners.push(gps)
    else {
      if (address != "") {
        var response = Maps.newGeocoder().geocode(address);
        Utilities.sleep(1000);
        if (response.results.length > 0) {
          var result = response.results[0];
          if ((result.geometry.location.lat < -8.000000) && (result.geometry.location.lat > -38.000000) && (result.geometry.location.lng > 7.000000) && (result.geometry.location.lng < 50.000000)) {
            corners.push(result.geometry.location.lat + "," + result.geometry.location.lng);
            row[15] = result.geometry.location.lat + "," + result.geometry.location.lng;
          }
        }
      }
    }
  }

  DriveApp.createFile(Utilities.newBlob(map.getMapImage(), 'image/png', 'map.png'));
  ds.getRange(rr).setValues(data);
}

function GetUpdateScheduleSheetgps() {
  var h = null;
  var aFileName = Session.getEffectiveUser().getEmail();

  aFileName = aFileName.substr(0, aFileName.indexOf("@")) + " - UpdateSchedule";
  var files = DriveApp.getFilesByName(aFileName);

  if (files.hasNext()) {
    var afile = files.next();
    var AUpdateSpreadSheet = SpreadsheetApp.open(afile);
    h = AUpdateSpreadSheet.getSheetByName('GPSData');


  }
  return h;

}


function CreateMap(map, corners, cl) {
  if (corners.length > 0) {
    corners.sort();
    corners.push(corners[0])

    map.setPathStyle(4, Maps.StaticMap.Color.BLACK, cl);
    map.beginPath();
    for (var i = 0; i < corners.length; i++) {
      map.addAddress(corners[i]);
    }
    map.endPath();

  }
}


var standardColorHexNameArray = [
  ["black", "dark grey 4", "dark grey 3", "dark grey 2", "dark grey 1", "grey", "light grey 1", "light grey 2", "light grey 3", "white"],
  ["0x000000", "0x434343", "0x666666", "0x999999", "0xb7b7b7", "0xcccccc", "0xd9d9d9", "0xefefef", "0xf3f3f3", "0xffffff"],
  ["red berry", "red", "orange", "yellow", "green", "cyan", "cornflower blue", "blue", "purple", "magenta"],
  ["0x980000", "0xff0000", "0xff9900", "0xffff00", "0x00ff00", "0x00ffff", "0x4a86e8", "0x0000ff", "0x9900ff", "0xff00ff"],
  ["light red berry 3", "light red 3", "light orange 3", "light yellow 3", "light green 3", "light cyan 3", "light cornflower blue 3", "light blue 3", "light purple 3", "light magenta 3"],
  ["0xe6b8af", "0xf4cccc", "0xfce5cd", "0xfff2cc", "0xd9ead3", "0xd0e0e3", "0xc9daf8", "0xcfe2f3", "0xd9d2e9", "0xead1dc"],
  ["light red berry 2", "light red 2", "light orange 2", "light yellow 2", "light green 2", "light cyan 2", "light cornflower blue 2", "light blue 2", "light purple 2", "light magenta 2"],
  ["0xdd7e6b", "0xea9999", "0xf9cb9c", "0xffe599", "0xb6d7a8", "0xa2c4c9", "0xa4c2f4", "0x9fc5e8", "0xb4a7d6", "0xd5a6bd"],
  ["light red berry 1", "light red 1", "light orange 1", "light yellow 1", "light green 1", "light cyan 1", "light cornflower blue 1", "light blue 1", "light purple 1", "light magenta 1"],
  ["0xcc4125", "0xe06666", "0xf6b26b", "0xffd966", "0x93c47d", "0x76a5af", "0x6d9eeb", "0x6fa8dc", "0x8e7cc3", "0xc27ba0"],
  ["dark red berry 1", "dark red 1", "dark orange 1", "dark yellow 1", "dark green 1", "dark cyan 1", "dark cornflower blue 1", "dark blue 1", "dark purple 1", "dark magenta 1"],
  ["0xa61c00", "0xcc0000", "0xe69138", "0xf1c232", "0x6aa84f", "0x45818e", "0x3c78d8", "0x3d85c6", "0x674ea7", "0xa64d79"],
  ["dark red berry 2", "dark red 2", "dark orange 2", "dark yellow 2", "dark green 2", "dark cyan 2", "dark cornflower blue 2", "dark blue 2", "dark purple 2", "dark magenta 2"],
  ["0x85200c", "0x990000", "0xb45f06", "0xbf9000", "0x38761d", "0x134f5c", "0x1155cc", "0x0b5394", "0x351c75", "0x741b47"],
  ["dark red berry 3", "dark red 3", "dark orange 3", "dark yellow 3", "dark green  3", "dark cyan 3", "dark cornflower blue 3", "dark blue 3", "dark purple 3", "dark magenta 3"],
  ["0x5b0f00", "0x660000", "0x783f04", "0x7f6000", "0x274e13", "0x0c343d", "0x1c4587", "0x073763", "0x20124d", "0x4c1130"]
];

function getnextcolour() {
  gc = gc + 2;
  if (gc > 4) {
    gr = gr + 2;
    gc = 1;
  }
  if (gr > 10)
    gr = 1;

  return standardColorHexNameArray[gr][gc]
};







///////////////////////////////////////
// onedit routines
////////////////////////////////////////


var sDateFormat = "MM/dd/yyyy HH:mm:ss";

function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;

  var aCol = range.getColumn();
  var aRow = range.getRow();
  var numRows = range.getNumRows();

  if (sheet.getName() == "qryExportField") {

    if ((aRow > 1) && (aCol < 20)) {
      var timestamp = new Date();
      sheet.getRange(aRow, 28, numRows, 1).setValue(timestamp);
    }

  }
  else if ((sheet.getIndex() > 3) &&
           (sheet.getIndex() < e.source.getNumSheets() - 2)) {

    if ((aCol != 15) && (aCol < 19) && (aRow > 1)) {

      for (var i = 0; i < numRows; i++) {

        var row = aRow + i;

        // Date stamp in column O
        sheet.getRange(row, 15).setValue(new Date());

        // UUID in column T
        var tCell = sheet.getRange(row, 20);
        var uuid = tCell.getValue();

        if (uuid == "") {
          tCell.setValue(Utilities.getUuid());
        }

        // Revision count in column U
        var uCell = sheet.getRange(row, 21);
        var rc = uCell.getValue();

        if (rc == "" || isNaN(rc)) {
          rc = 0;
        }

        rc++;
        uCell.setValue(rc);

        // Background A:T
        sheet.getRange(row, 1, 1, 20)
             .setBackgroundRGB(getRevCol(rc), getRevCol(rc), getRevCol(rc));
      }
    }
  }
}

function random(min, max) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
}


function getRevCol(revcnt) {

  var acol = revcnt * 10;
  acol = random(180, 250);
  return acol;

}

function ResetUpdateFlag(aSheetName) {
  // var aFileName = "UpdateSchedule";

  //  var files = DriveApp.getRootFolder().getFiles();


  // while (files.hasNext()) 
  //  {
  //  var afile = files.next();
  //   if (afile.getName().indexOf(aFileName) > 0  )
  //  {
  var AUpdateSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var h = AUpdateSpreadSheet.getSheetByName('Update Schedule');

  var dataRange = h.getRange("A2:J50");
  var data = dataRange.getValues();
  for (var i = 0; i < data.length; i++) {
    var aRow = data[i]
    var aName = aRow[0];

    if (aName == aSheetName) {
      aRow[9] = 'y';
      dataRange.setValues(data);
      break;
    }
  }
  // }
  //}
}






//////////////////////////////////////////
// populate menu
///////////////////////////////////////////

var cAmountOfDaysToKeepExports = 2;
var cExportName = 'Export - RSA Address Book';
var cExportFolderName = 'Exports - RSA Address Book';
var cFirstSheet = 5
var cNumberOfColumns = 22
var cNumberOfSheets = 42

function ExportData() {
  PrepareContactsExportSheet();

}

function Export() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ClearAllContactsInExportSheet(ss);
  CopyAllContactsIntoExportSheet(ss);
}

function SetExportedTime(ss) {
  return;
  var aSheet = ss.getSheetByName('qryExport');
  var r = aSheet.getRange("A2501");
  r.setValue(Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd   HH:mm:ss"));


}

function PrepareContactsExportSheet() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var ExportFile = ss.copy(cExportName + ' - ' + Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd HH-mm-ss"));
  var aRootFolder = DriveApp.getRootFolder();

  var ExportFolders = aRootFolder.getFoldersByName(cExportFolderName);
  var ExportFolder = null;

  if (ExportFolders.hasNext())
    ExportFolder = ExportFolders.next();
  else
    ExportFolder = DriveApp.createFolder(cExportFolderName);

  ExportFolder.addFile(DriveApp.getFileById(ExportFile.getId()));
  DriveApp.getRootFolder().removeFile(DriveApp.getFileById(ExportFile.getId()));

  ClearAllContactsInExportSheet(ExportFile);
  CopyAllContactsIntoExportSheet(ExportFile);
  SetExportedTime(ExportFile);


  DeleteOldExports(ExportFolder);
}


function DeleteOldExports(ExportFolder) {

  //var files = DriveApp.getFiles();
  var files = ExportFolder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var f = file.getName();
    if (f.indexOf(cExportName) > -1) {
      var dc = file.getDateCreated();

      if (dc.valueOf() < new Date().valueOf() - (cAmountOfDaysToKeepExports * 24 * 60 * 60 * 1000))
      //     if (dc.valueOf() < new Date().valueOf()-(1000*60*1)) // 1 minute
      {
        file.setTrashed(true);

      }
    }
  }
}


function ClearAllContactsInExportSheet(ss) {
  return;
  ss.getSheetByName('qryExport').clear();

}

function CopyAllContactsIntoExportSheet(ss) {
  return;
  var sss = ss.getSheets();
  var qryExportSheet = ss.getSheetByName('qryExport');
  var aSheet = ss.getSheetByName('qryExport');
  var iii = 1;

  for (var ii = cFirstSheet; ii <= cFirstSheet + cNumberOfSheets; ii++) {
    aSheet = sss[ii];
    if (ii == cFirstSheet)
      iii = 1
    else
      iii = 2
    var rangeToCopy = aSheet.getRange(iii, 1, aSheet.getMaxRows(), cNumberOfColumns);
    rangeToCopy.copyTo(qryExportSheet.getRange(qryExportSheet.getLastRow() + 1, 1));

  }

}


function SendBooks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aSheet = ss.getSheetByName("qryExportField");
  var dataRange = aSheet.getRange("A2:R802");
  var data = dataRange.getValues();

  var mrow = data[799];
  var aMessage = mrow[0];
  var srow = data[800];
  var aMustsendit = srow[0];

  if (aMustsendit == "y") {

    var filese = DriveApp.getFilesByName('Admin - View.pdf');
    var filee = filese.next();

    for (var i = 0; (i < data.length - 1); ++i) {


      var row = data[i];

      var aName1 = row[14];
      var aEmail1 = row[15];
      var aName2 = row[16];
      var aEmail2 = row[17];
      var aField = row[1];
      var aProvince = row[0];
      var aMustSend = "a";
      aMustSend = row[14];

      if (aMustSend == "")
        continue;

      var aName = aName1;
      var aEmail = aEmail1;

      if (aName2.length > 0)
        aName = aName + " and " + aName2;

      if (aEmail2.length > 0)
        aEmail = aEmail + ", " + aEmail2;

      if ((aName.length > 0) && (aEmail.length > 0) && (aField.length > 0)) {

        try {
          var files = DriveApp.getFilesByName(aField + ' - View.pdf');
          var file = files.next();

          var filesb = DriveApp.getFilesByName(aField + ' - Print.pdf');
          var fileb = filesb.next();

          var filesc = DriveApp.getFilesByName(aProvince + ' - View.pdf');
          var filec = filesc.next();

          var filesd = DriveApp.getFilesByName(aProvince + ' - Print.pdf');
          var filed = filesd.next();


          //      MailApp.sendEmail(aEmail, "Address Book - "+aField, "Dear "+aName+". Attached is the address book for "+aField+". "+aMessage,{
          //   attachments: [file.getAs(MimeType.PDF),fileb.getAs(MimeType.PDF),filec.getAs(MimeType.PDF),filed.getAs(MimeType.PDF),filee.getAs(MimeType.PDF)],
          //   name: 'Address Book'});

          MailApp.sendEmail(aEmail, "Address Book - " + aField, "Dear " + aName + ". Attached is the address book for " + aField + ". " + aMessage, {
            attachments: [file.getAs(MimeType.PDF), fileb.getAs(MimeType.PDF), filec.getAs(MimeType.PDF), filed.getAs(MimeType.PDF)],
            name: 'Address Book'
          });

          //  file.setTrashed(true);
          //  fileb.setTrashed(true);

          var arow = i + 2;
          var r = aSheet.getRange("H" + arow);
          r.setValue("");


        } catch (e) {
          var arow = i + 2;
          var r = aSheet.getRange("G" + arow);
          r.setValue(aField + " " + e.message);
        }
      }

      var r = aSheet.getRange("A201");
      r.setValue("");

    }
  }

}

function SendAddressBooks() {

  if (Browser.msgBox("Are you sure you want to email the Address Books?", Browser.Buttons.OK_CANCEL) == "ok") {

    SendBooks();
    Browser.msgBox("Success. Address Books sent.")

  }
  else {
    Browser.msgBox("Aborted. Address Books not sent.")
  }


}

function ListAllSheetNamesInImportSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var is = ss.getSheetByName('ImportSheets');
  var j = 0
  is.clearContents();
  var sheets = ss.getSheets();
  for (i in sheets) {
    var sheetName = sheets[i].getName();
    j = j + 1
    is.getRange(j, 1).setValue(sheetName);
  }
}

function StandardizeGPSValue(coor) {
  var sign = 1
  var deg = coor.replace(/^\s+|\s+$/g, ""); //trim leading spaces
  var min = 0;
  var sec = 0;
  var spacePos = deg.search(" ");
  if (spacePos > -1) {
    min = deg.slice(spacePos + 1);
    deg = Number(deg.slice(0, spacePos));
    if (deg < 0) {
      deg = -deg
      sign = -sign
    }
    spacePos = min.search(" ");
    if (spacePos > -1) {
      sec = min.slice(spacePos + 1);
      min = min.slice(0, spacePos);
      spacePos = min.search(" ");
    }
  }
  var result = sign * (Number(min) / 60 + Number(sec) / 3600 + Number(deg));
  return Math.round(result * 1000000) / 1000000
}

function ProcessGPSCell(cell) {
  var value = cell.getValue()
  if ((value.search(",") > -1) && (value.search("." > -1))) {
    var commaPos = value.search(",");
    var Sstr = value.slice(0, commaPos);
    var Estr = value.slice(commaPos + 1);
    var s = StandardizeGPSValue(Sstr);
    var e = StandardizeGPSValue(Estr);
    if ((s != NaN) && (e != NaN)) {
      cell.setValue(-s);
      nextCell = cell.getSheet().getRange(cell.getRow(), cell.getColumn() + 1)
      nextCell.setValue(e)
    }
  } else {
    result = StandardizeGPSValue(value)
    if (result != NaN && result != 0) {
      cell.setValue(result)
    }
  }
}

function StandardizeGPSRange() {
  var arange = SpreadsheetApp.getActiveRange();
  //var ss = SpreadsheetApp.getActiveSpreadsheet(); 
  var startRow = arange.getRow()
  var startCol = arange.getColumn()
  for (row = 1; row <= arange.getNumRows(); row++) {
    for (col = 1; col <= arange.getNumColumns(); col++) {
      cell = arange.getCell(row, col);
      ProcessGPSCell(cell)
    }
  }
}

function ConvertSEGPStoStr(S, E) {
  return -Number(S).toString() + "," + E
}

function testGps() {
  //    Browser.msgBox(StandardizeGPSValue("-28 58.159") + " " + StandardizeGPSValue("100 30 30")+ " " 
  //    + StandardizeGPSValue("100.999999")+ " " + StandardizeGPSValue("1 0 1"));
}






///////////////////////////////////////
// register user
////////////////////////////////


function register_users() {
  var register_spreadsheet_name = "Register User in Address Book"
  var register_sheet_name = "Register"

  try {
    var files = DriveApp.getRootFolder().getFilesByName(register_spreadsheet_name);

    if (files.hasNext()) {
      var afile = files.next();

      var register_spreadsheet = SpreadsheetApp.open(afile);

      var register_sheet = register_spreadsheet.getSheetByName(register_sheet_name);
      var data = register_sheet.getRange("A2:c1000");
      var register_data = data.getValues();

      for (var i = 0; i < register_data.length; i++) {
        var user = register_data[i][0];
        var reg_date = register_data[i][1];

        if (user == "")
          continue;
        if (reg_date != "")
          continue;

        var error = register_user(user);
        register_data[i][1] = new Date();
        register_data[i][2] = error;

      }

      data.setValues(register_data);
    }

  }
  catch (e) {
  }

}

function register_user(aUser) {
  try {
    var aresult = "1.";
    var site_url = "https://sites.google.com/site/rsaaddressbookchanges/";
    //   var site =  SitesApp.getSiteByUrl(site_url)
    // the scripting does not support sites made with new version

    var aresult = "2.";
    // site.addViewer(aUser);
    var aresult = "3.";


    var ss = gvRSAAddressBook;
    var aresult = "4.";
    ss.addViewer(aUser);
    var aresult = "5.";
    //https://sites.google.com/d/1IO-uEdH2MkJeoJexKGCYkr_T7zni9mpF/p/1TCreh7S_rd5SisLTZm3bMJWRvJBMAKNp/edit


    GmailApp.sendEmail(aUser, "RSA Address Book registration", "Congratulations! You are almost finished setting up the adress book syncing. Click on the link and follow the instructions there. https://sites.google.com/site/rsaaddressbookchanges/googlecontactssetup")
    aresult = "Success";
  }
  catch (e) {
    aresult = aresult + " " + e.message;
  }

  return aresult;
}






///////////////////////////////////////////////////
// reset update flag
///////////////////////////////////////////////////

function ResetUpdateFlagsRoutine() {

  //  var AUpdateSpreadSheet = SpreadsheetApp.getActiveSpreadsheet()
  var AUpdateSpreadSheet = gvRSAAddressBook;
  if (AUpdateSpreadSheet == null)
    return;
  var h = AUpdateSpreadSheet.getSheetByName('Update Schedule');

  var dataRange = h.getRange("A2:J50");
  var data = dataRange.getValues();
  for (var i = 0; i < data.length; i++) {
    var aRow = data[i]
    var aName = aRow[0];
    var mu = aRow[9];

    if (mu == 'y') {
      ResetUpdateFlags(aName);
      aRow[9] = '';
      dataRange.setValues(data);

    }
  }

}

function ResetUpdateFlags(aSheetName) {
  var aFileName = "UpdateSchedule";

  var files = DriveApp.getRootFolder().getFiles();


  while (files.hasNext()) {
    var afile = files.next();
    if (afile.getName().indexOf(aFileName) > 0) {
      var AUpdateSpreadSheet = SpreadsheetApp.open(afile);
      var h = AUpdateSpreadSheet.getSheetByName('Update Schedule');

      var dataRange = h.getRange("A2:J50");
      var data = dataRange.getValues();
      for (var i = 0; i < data.length; i++) {
        var aRow = data[i]
        var aName = aRow[0];

        if (aName == aSheetName) {
          aRow[4] = '';
          // aRow[8] = '' ;
          // aRow[9] = '' ;
          dataRange.setValues(data);
          break;
        }
      }
    }
  }
}
