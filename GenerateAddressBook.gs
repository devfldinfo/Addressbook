//version 1.0

const ssGenerate = "1dLZoc2x7XxfoHlfNEoR15wvJs4s3A5PqAMBIeogMgeA";
const ssAddrBook = "1bTu20GBp_ccaOpClMe986caiLBXzeSoSKNMa-OxhZ-I";
const fldAddrTexFiles = "15-6hB7Eb3x6VYMQcUNUQkLZJvTX373jn";
const fldAddrPDFs = "0B610AIQfgYv6elZtYXdmX1VPS0k";
const fldAddrStartFile = "1vjzEeLjKj4VyTViHO4im9uyCKwMlonZw";


const CONFIG = (() => {
  const props = PropertiesService.getScriptProperties();
  return {
    GITHUB_TOKEN: props.getProperty('GITHUB_TOKEN'),
    GITHUB_OWNER: props.getProperty('GITHUB_OWNER'),
    GITHUB_REPO: props.getProperty('GITHUB_REPO'),
    GITHUB_BRANCH: 'main'
  };
})();


function Stage1() {
  copyDataBetweenSheets();
  deleteFilesInFolder(fldAddrTexFiles);
  GenerateTexFiles();
  generateBirthdayCalendar();

  deleteFilesFromGitHub("output");
  deleteFilesFromGitHub("input");

  uploadFilesToGitHub(fldAddrTexFiles);
  uploadFilesToGitHub(fldAddrStartFile);
}

function Stage2() {
  if (checkOutputFolderForViewPdf()) {
    deleteFilesInFolder(fldAddrPDFs);
    downloadGithubPDFsFromZip();
  }
  else
    Stage1(); //If error occured while generating the pdf files, try again
}

function Stage3() {
  downloadGithubFiles("view.pdf"); //Incase some files where not downloaded. This function only downloads missing files.

  checkAndNotifyMissingPDFs();
}

/**
 * Checks a GitHub folder named "output" for PDF files with the suffix "view".
 *
 * @return {boolean} True if a file named "*view.pdf" exists in the folder, otherwise false.
 */
function checkOutputFolderForViewPdf() {
  const folderPath = 'output';
  const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${folderPath}`;

  const options = {
    'headers': {
      'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    'muteHttpExceptions': true // Prevents errors from stopping script execution.
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    // Check if the API request was successful (HTTP 200 OK).
    if (responseCode === 200) {
      const contents = JSON.parse(response.getContentText());

      // If the contents are an array, iterate through the files.
      if (Array.isArray(contents)) {
        for (let i = 0; i < contents.length; i++) {
          const file = contents[i];
          // Check if the item is a file and its name ends with "view.pdf".
          if (file.type === 'file' && file.name.endsWith('View.pdf')) {
            Logger.log(`Found a matching file: ${file.name}`);
            return true; // Return true as soon as a match is found.
          }
        }
      }

      Logger.log('No matching PDF files found in the "output" folder.');
      return false; // No matching files found after checking all contents.
    } else {
      // Log the error if the API request fails.
      Logger.log(`Error fetching folder contents. Response Code: ${responseCode}`);
      Logger.log(`Response Text: ${response.getContentText()}`);
      return false;
    }
  } catch (e) {
    Logger.log(`An error occurred: ${e.toString()}`);
    return false;
  }
}

function downloadGithubFiles(asuffix) {
  var owner = CONFIG.GITHUB_OWNER;
  var repo = CONFIG.GITHUB_REPO;
  var folder = "output";
  var token = CONFIG.GITHUB_TOKEN;

  var githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`;
  var options = {
    method: "get",
    headers: {
      "Authorization": "token " + token
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(githubUrl, options);
  if (response.getResponseCode() !== 200) {
    Logger.log("Error fetching files: " + response.getContentText());
    return;
  }

  var files = JSON.parse(response.getContentText());
  var driveFolder = getOrCreateFolder(fldAddrPDFs);

  files.forEach(function (file) {

    if (file.name.toLowerCase().endsWith(asuffix) && file.download_url) {

      // Check if file already exists in Drive
      var existingFiles = driveFolder.getFilesByName(file.name);

      if (existingFiles.hasNext()) {
        Logger.log("Skipping existing file: " + file.name);
      } else {

        var success = false;
        var attempts = 0;

        while (!success && attempts < 3) {
          try {
            var fileResponse = UrlFetchApp.fetch(file.download_url, options);

            if (fileResponse.getResponseCode() === 200) {
              var blob = fileResponse.getBlob().setName(file.name);
              driveFolder.createFile(blob);
              Logger.log("Downloaded: " + file.name);
              success = true;
            } else {
              Logger.log("Attempt " + (attempts + 1) + " failed for: " + file.name);
              Utilities.sleep(10000);
            }

          } catch (e) {
            Logger.log("Attempt " + (attempts + 1) + " error: " + e.toString());
            Utilities.sleep(10000);
          }

          attempts++;
        }

        if (!success) {
          Logger.log("Failed to download: " + file.name + " after 3 attempts.");
        }

        Utilities.sleep(1000);
      }
    }

  });

  Logger.log("Download process completed.");
}

function downloadGithubPDFsFromZip() {
  const owner = CONFIG.GITHUB_OWNER;
  const repo = CONFIG.GITHUB_REPO;
  const branch = CONFIG.GITHUB_BRANCH;
  const token = CONFIG.GITHUB_TOKEN;

  const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;

  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: "token " + token,
      Accept: "application/vnd.github+json"
    },
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const contentType = response.getHeaders()["Content-Type"];

  Logger.log("Response code: " + code);
  Logger.log("Content-Type: " + contentType);

  if (code !== 200) {
    Logger.log("Error response: " + response.getContentText());
    return;
  }

  // 🚨 Critical check
  if (!contentType || !contentType.includes("zip")) {
    Logger.log("Not a ZIP! Response was:");
    Logger.log(response.getContentText().slice(0, 500));
    return;
  }

  const zipBlob = response.getBlob().setName("repo.zip");

  let unzippedFiles;
  try {
    unzippedFiles = Utilities.unzip(zipBlob);
  } catch (e) {
    Logger.log("Unzip failed: " + e.toString());
    return;
  }

  const driveFolder = getOrCreateFolder(fldAddrPDFs);

  let count = 0;

  unzippedFiles.forEach(file => {
    const name = file.getName();

    if (
      name.toLowerCase().endsWith(".pdf") &&
      name.includes("/output/")
    ) {
      const cleanName = name.split("/").pop();

      if (!driveFolder.getFilesByName(cleanName).hasNext()) {
        driveFolder.createFile(file.setName(cleanName));
        count++;
      }
    }
  });

  Logger.log(`Extracted ${count} PDFs`);
}

function deleteFilesFromGitHub(folderPath) {
  const token = CONFIG.GITHUB_TOKEN;
  const owner = CONFIG.GITHUB_OWNER;
  const repo = CONFIG.GITHUB_REPO;
  const branch = CONFIG.GITHUB_BRANCH;

  const headers = {
    Authorization: "token " + token,
    Accept: "application/vnd.github.v3+json"
  };

  // 1. Get latest commit
  const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`;
  const ref = JSON.parse(UrlFetchApp.fetch(refUrl, { headers }).getContentText());
  const latestCommitSha = ref.object.sha;

  // 2. Get tree
  const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`;
  const commit = JSON.parse(UrlFetchApp.fetch(commitUrl, { headers }).getContentText());
  const treeSha = commit.tree.sha;

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;
  const tree = JSON.parse(UrlFetchApp.fetch(treeUrl, { headers }).getContentText());

  // 3. Filter OUT files in folderPath (i.e., delete them)
  const newTree = tree.tree
    .filter(item => !item.path.startsWith(folderPath))
    .map(item => ({
      path: item.path,
      mode: item.mode,
      type: item.type,
      sha: item.sha
    }));

  // 4. Create new tree
  const createTreeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees`;
  const newTreeRes = JSON.parse(UrlFetchApp.fetch(createTreeUrl, {
    method: "post",
    headers,
    payload: JSON.stringify({ tree: newTree })
  }).getContentText());

  // 5. Create commit (FIXED)
  const createCommitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits`;

  const commitRes = JSON.parse(UrlFetchApp.fetch(createCommitUrl, {
    method: "post",
    headers,
    payload: JSON.stringify({
      message: "Clear folder " + folderPath,
      tree: newTreeRes.sha,
      parents: [latestCommitSha]
    })
  }).getContentText());

  UrlFetchApp.fetch(refUrl, {
    method: "patch",
    headers,
    payload: JSON.stringify({
      sha: commitRes.sha,
      force: true
    })
  });

  Logger.log("Folder cleared in one commit");
}

function uploadFilesToGitHub(folderName) {
  const token = CONFIG.GITHUB_TOKEN;
  const owner = CONFIG.GITHUB_OWNER;
  const repo = CONFIG.GITHUB_REPO;
  const branch = CONFIG.GITHUB_BRANCH;
  const githubFolder = "input"; // no trailing slash

  const headers = {
    Authorization: "token " + token,
    Accept: "application/vnd.github.v3+json"
  };

  const folder = getOrCreateFolder(folderName);
  if (!folder) {
    Logger.log("Folder not found: " + folderName);
    return;
  }

  // 1. Get latest commit
  const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`;
  const ref = JSON.parse(UrlFetchApp.fetch(refUrl, { headers }).getContentText());
  const latestCommitSha = ref.object.sha;

  // 2. Get base tree
  const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`;
  const commit = JSON.parse(UrlFetchApp.fetch(commitUrl, { headers }).getContentText());
  const baseTreeSha = commit.tree.sha;

  // 3. Build new tree entries (ALL files)
  const files = folder.getFiles();
  const tree = [];

  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    const content = Utilities.base64Encode(file.getBlob().getBytes());

    tree.push({
      path: `${githubFolder}/${fileName}`,
      mode: "100644",
      type: "blob",
      content: Utilities.newBlob(Utilities.base64Decode(content)).getDataAsString()
    });
  }

  if (tree.length === 0) {
    Logger.log("No files to upload.");
    return;
  }

  // 4. Create new tree
  const createTreeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees`;
  const newTree = JSON.parse(UrlFetchApp.fetch(createTreeUrl, {
    method: "post",
    headers,
    payload: JSON.stringify({
      base_tree: baseTreeSha,
      tree: tree
    })
  }).getContentText());

  // 5. Create commit
  const createCommitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits`;
  const newCommit = JSON.parse(UrlFetchApp.fetch(createCommitUrl, {
    method: "post",
    headers,
    payload: JSON.stringify({
      message: `Batch upload from ${folderName}`,
      tree: newTree.sha,
      parents: [latestCommitSha]
    })
  }).getContentText());

  // 6. Update branch
  UrlFetchApp.fetch(refUrl, {
    method: "patch",
    headers,
    payload: JSON.stringify({
      sha: newCommit.sha,
      force: true
    })
  });

  Logger.log(`Uploaded ${tree.length} files in one commit.`);
}

function GenerateTexFiles() {
  var sheetId = ssGenerate;
  var sheetName = "qryExportField";
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log("Sheet not found: " + sheetName);
    return;
  }

  // Get data from row 1 to row 800 (limiting to 800 rows)
  var data = sheet.getRange(1, 1, 800, sheet.getLastColumn()).getValues();
  if (data.length < 2) {
    Logger.log("No data available.");
    return;
  }

  // Remove headers
  data.shift();

  // Sort data by column A, B, then C
  data.sort((a, b) => {
    return a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]) || a[2].localeCompare(b[2]);
  });

  var provinces = {};

  // Iterate through data and create unique objProvince, objField, and objMeeting objects
  data.forEach(row => {
    var provinceName = row[0];
    if (!provinceName) { // Skip if province name is empty
      return;
    }

    var provinceHeader = row[24]; // Column Y (zero-based index 24)
    var fieldName = row[1];
    var fieldHeader = row[25]; // Column Z (zero-based index 25)
    var meetingName = row[2];
    var meetingHeader = row[26]; // Column AA (zero-based index 26)

    // Column D, E, F, G for new attributes of objMeeting
    var isAM = row[3]; // Column D (isAM)
    var isPM = row[4]; // Column E (isPM)
    var isWed = row[5]; // Column F (isWed)
    var realName = row[6]; // Column G (realName)

    // Column K, L for displayAsMtg and displayInPhlist
    var displayAsMtg = row[10]; // Column K (displayAsMtg)
    var displayInPhlist = row[11]; // Column L (displayInPhlist)

    // Create objProvince if it doesn't exist
    if (!provinces[provinceName]) {
      provinces[provinceName] = new objProvince(provinceName, provinceHeader);
    }

    var province = provinces[provinceName];

    // Create objField if it doesn't exist
    var field = province.fields.find(f => f.fldname === fieldName);
    if (!field) {
      field = new objField(fieldName, fieldHeader);
      province.fields.push(field);
    }

    // Create objMeeting if it doesn't exist
    var meeting = field.meetings.find(m => m.mtgName === meetingName);
    if (!meeting) {
      meeting = new objMeeting(meetingName, meetingHeader, isAM, isPM, isWed, displayAsMtg, displayInPhlist, realName);
      field.meetings.push(meeting);
    }
  });

  Logger.log("Provinces, Fields, and Meetings created:");
  //Logger.log(provinces);

  // Now, read the data from LtxHomesAll and iterate through the values
  var sheetLtxHomesAll = ss.getSheetByName("LtxHomesAll");
  if (!sheetLtxHomesAll) {
    Logger.log("Sheet not found: LtxHomesAll");
    return;
  }

  // Get all data from LtxHomesAll (adjust range if necessary)
  var dataLtxHomesAll = sheetLtxHomesAll.getDataRange().getValues();

  // Iterate through data from LtxHomesAll
  dataLtxHomesAll.forEach(row => {
    var mtgNameFromX = row[23]; // Column X (zero-based index 23)
    var homeAddressFromAD = row[29]; // Column AD (zero-based index 29)
    var homeAddressFromJ = row[9]; // Column J (zero-based index 9)

    // Find the corresponding objMeeting object by checking if mtgNameFromX is part of the meeting name
    for (var provinceName in provinces) {
      var province = provinces[provinceName];

      // Iterate over each field and its meetings to find matching mtgName
      province.fields.forEach(field => {
        field.meetings.forEach(meeting => {

          var tmpmtgName = "¬" + meeting.mtgName + "¬";

          if (mtgNameFromX.indexOf(tmpmtgName) !== -1) {
            // Create objHome with the values from columns J and AD
            var home = new objHome(homeAddressFromAD, homeAddressFromJ);

            // Add the home to the meeting's homes list
            meeting.homes.push(home);
          }
        });
      });
    }
  });

  Logger.log("Homes added to meetings in provinces:");

  sortMeetings(provinces);

  // Now we iterate through the provinces list and create the final text output
  var ltxRSACompleteTxt = '';
  var ltxRSAHmsTxt = '';
  var ltxRSAMtgsTxt = '';
  var ltxProvCompleteTxt = '';
  var ltxProvHmsTxt = '';
  var ltxProvMtgsTxt = '';
  var ltxCompleteTxt = '';
  var ltxHmsTxt = '';
  var ltxMtgsTxt = '';
  var hasHomes = false;
  var hasProvHomes = false;

  // Iterate through provinces, fields, meetings, and homes
  for (var provinceName in provinces) {
    var province = provinces[provinceName];
    ltxProvHmsTxt = '';
    ltxProvMtgsTxt = '';
    hasProvHomes = false;

    ltxProvCompleteTxt = `\\documentclass[english]{article}\n\\title{${province.prvname}}\n\\author{}\n\\usepackage{addressbook1}\n\\begin{document}\n\\maketitle\n\\clearpage\n\\pagenumbering{arabic}\n\\CSNormal\n`;

    province.fields.forEach(field => {
      // Clear ltxHmsTxt and ltxMtgsTxt before starting the field iteration
      ltxHmsTxt = '';
      ltxMtgsTxt = '';
      hasHomes = false;

      ltxCompleteTxt = `\\documentclass[english]{article}\n\\title{${field.fldname}}\n\\author{}\n\\usepackage{addressbook1}\n\\begin{document}\n\\maketitle\n\\clearpage\n\\pagenumbering{arabic}\n\\CSNormal\n`;

      field.meetings.forEach(meeting => {
        // Append the mtgHeader to ltxMtgsTxt
        if (meeting.homes.length > 0) {

          if (meeting.displayAsMtg)
            ltxMtgsTxt += `${meeting.mtgHeader}\n`;

          meeting.homes.forEach(home => {
            if (meeting.displayAsMtg) {
              hasHomes = true;
              hasProvHomes = true;
              // Append the hmeltxMtg to ltxMtgsTxt
              ltxMtgsTxt += `${home.hmeltxMtg}\n`;
            }

            if (meeting.displayInPhlist && meeting.isAM) {
              // Append the hmeltxHome to ltxHmsTxt

              var tmpTxt = removeCarriageReturns(home.hmeltxHome);

              ltxHmsTxt += tmpTxt + '\n';
            }


          });
        }
      });

      if (hasHomes) {
        ltxMtgsTxt = `${field.fldltxheader}\n` + ltxMtgsTxt;
      }

      ltxProvHmsTxt += ltxHmsTxt;
      ltxProvMtgsTxt += ltxMtgsTxt;


      // Append the content of ltxHmsTxt to ltxCompleteTxt after each field iteration
      ltxCompleteTxt += sortLines(ltxHmsTxt);

      // Append the closing lines for homes and sections
      ltxCompleteTxt += '\\EndHomes\n\\EndSection\n';

      // Append the content of ltxMtgsTxt to ltxCompleteTxt after each field iteration
      ltxCompleteTxt += ltxMtgsTxt;


      // Append the final closing text for the LaTeX document
      ltxCompleteTxt += '\\end{document}\n';

      // Use the field.fldname as the filename
      var fileName = field.fldname; // Assuming fldname is unique for each field

      saveToTextFile(fldAddrTexFiles, fileName, escapeSpecialCharacters(ltxCompleteTxt));

    });

    if (hasProvHomes) {
      ltxProvMtgsTxt = province.prvltxheader + '\n' + ltxProvMtgsTxt;
    }

    ltxRSAHmsTxt += ltxProvHmsTxt;
    ltxRSAMtgsTxt += ltxProvMtgsTxt;

    // Append the content of ltxHmsTxt to ltxCompleteTxt after each field iteration
    ltxProvCompleteTxt += sortLines(ltxProvHmsTxt);

    // Append the closing lines for homes and sections
    ltxProvCompleteTxt += '\\EndHomes\n\\EndSection\n';

    ltxProvCompleteTxt += ltxProvMtgsTxt;

    ltxProvCompleteTxt += '\\end{document}\n';

    var provFileName = province.prvname;
    saveToTextFile(fldAddrTexFiles, provFileName, escapeSpecialCharacters(ltxProvCompleteTxt));
  }

  ltxRSACompleteTxt = `\\documentclass[english]{article}\n\\title{Southern and East Africa}\n\\author{}\n\\usepackage{addressbook1}\n\\begin{document}\n\\maketitle\n\\clearpage\n\\pagenumbering{arabic}\n\\CSNormal\n`;

  // Append the content of ltxHmsTxt to ltxCompleteTxt after each field iteration
  ltxRSACompleteTxt += sortLines(ltxRSAHmsTxt);

  // Append the closing lines for homes and sections
  ltxRSACompleteTxt += '\\EndHomes\n\\EndSection\n';

  ltxRSAMtgsTxt = '\\MLProvH{Southern & East Africa}\n' + ltxRSAMtgsTxt;

  // Append the content of ltxMtgsTxt to ltxCompleteTxt after each field iteration
  ltxRSACompleteTxt += ltxRSAMtgsTxt;

  // Append the final closing text for the LaTeX document
  ltxRSACompleteTxt += '\\end{document}\n';

  // Use the field.fldname as the filename
  var fileName = 'Southern and East Africa'; // Assuming fldname is unique for each field

  saveToTextFile(fldAddrTexFiles, fileName, escapeSpecialCharacters(ltxRSACompleteTxt));

}


// Helper function to escape special characters by adding a backslash before them
function escapeSpecialCharacters(text) {

  if (!text) return ""; // Return empty string if input is null or undefined

  return text.replace(/(^|[^\\])([#&_%$~])/g, (match, before, char) => before + "\\" + char);

}

function removeCarriageReturns(text) {
  return text.replace(/\r/g, "");
}

function sortMeetings(provinces) {
  for (var provinceName in provinces) {
    var province = provinces[provinceName];

    province.fields.forEach(field => {
      field.meetings.sort((a, b) => {
        return (b.isAM - a.isAM) || (b.isPM - a.isPM) || (b.isWed - a.isWed);
      });
    });
  }
}

function sortLines(text) {
  return text
    .split("\n")  // Split text into an array of lines
    .filter(line => line.trim() !== "")  // Remove empty lines
    .sort()  // Sort alphabetically
    .join("\n");  // Join back into a single string
}

// Example constructors for the objects
function objProvince(prvname, prvltxheader) {
  this.prvname = prvname;
  this.prvltxheader = prvltxheader;
  this.fields = []; // Array to store objField objects
}

function objField(fldname, fldltxheader) {
  this.fldname = fldname;
  this.fldltxheader = fldltxheader;
  this.meetings = []; // Array to store objMeeting objects
}

function objMeeting(mtgName, mtgHeader, isAM, isPM, isWed, displayAsMtg, displayInPhlist, realName) {
  this.mtgName = mtgName;
  this.mtgHeader = mtgHeader;
  this.isAM = isAM;
  this.isPM = isPM;
  this.isWed = isWed;
  this.displayAsMtg = displayAsMtg;
  this.displayInPhlist = displayInPhlist;
  this.realName = realName;
  this.homes = []; // Array to store objHome objects
}

function objHome(hmeltxHome, hmeltxMtg) {
  this.hmeltxHome = hmeltxHome;
  this.hmeltxMtg = hmeltxMtg;
}

//Google Sheets functions
function copySheetData(sourceSpreadsheet, targetSpreadsheet, sourceSheetName, targetSheetName) {
  var sourceSheet = sourceSpreadsheet.getSheetByName(sourceSheetName);
  if (!sourceSheet) {
    Logger.log("Source sheet '%s' not found.", sourceSheetName);
    return;
  }

  var targetSheet = targetSpreadsheet.getSheetByName(targetSheetName);
  if (!targetSheet) {
    targetSheet = targetSpreadsheet.insertSheet(targetSheetName);
  } else {
    targetSheet.clear();
  }

  var data = sourceSheet.getDataRange().getValues();
  if (data.length > 0) {
    targetSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
}

function copyDataBetweenSheets() {
  var sourceSpreadsheet = SpreadsheetApp.openById(ssAddrBook);
  var targetSpreadsheet = SpreadsheetApp.openById(ssGenerate);

  copySheetData(sourceSpreadsheet, targetSpreadsheet, "qryExport", "Data");
  copySheetData(sourceSpreadsheet, targetSpreadsheet, "qryExportField", "qryExportField");
}

//Google Drive Functions
// Helper function to get or create a folder
function getOrCreateFolder(folderName) {
  return DriveApp.getFolderById(folderName);
}

// Function to save content to a text file
function saveToTextFile(afolder, fileName, content) {
  var folder = getOrCreateFolder(afolder);

  var file = folder.createFile(fileName + " - View.txt", escapeSpecialCharacters(content));
  Logger.log("Text file created: " + fileName + " - View.txt");
}

function deleteFilesInFolder(folderId) {
  const MAX_RETRIES = 3;
  const SLEEP_MS = 500; // adjust if needed

  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();

    let count = 0;

    while (files.hasNext()) {
      const file = files.next();
      let success = false;
      let attempts = 0;

      while (!success && attempts < MAX_RETRIES) {
        try {
          file.setTrashed(true);
          success = true;
          Logger.log("Deleted: " + file.getName());
        } catch (e) {
          attempts++;
          Logger.log(`Retry ${attempts} for ${file.getName()}: ${e}`);

          if (attempts < MAX_RETRIES) {
            Utilities.sleep(SLEEP_MS * attempts); // exponential backoff
          } else {
            Logger.log("Failed permanently: " + file.getName());
          }
        }
      }

      count++;

      // Prevent hitting rate limits
      if (count % 20 === 0) {
        Utilities.sleep(1000);
      }
    }

    Logger.log("Completed deletion in folder: " + folderId);

  } catch (e) {
    Logger.log("Fatal error: " + e.toString());
  }
}

function generateBirthdayCalendar() {
  const ss = SpreadsheetApp.openById("1bTu20GBp_ccaOpClMe986caiLBXzeSoSKNMa-OxhZ-I");
  const sheet = ss.getSheetByName("Africa Workers");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

  let people = [];
  data.forEach(row => {
    const surname = row[0];
    const name = row[1];
    const details = row[3];
    if (!surname || !name || !details) return;

    let dobMatch = details.match(/Date of Birth:\s*([A-Za-z]+,\s*\d+\s+[A-Za-z]+\s+\d{4})/);
    let startMatch = details.match(/Started in Work:\s*(\d{4})/);

    if (dobMatch) {
      let dob = new Date(dobMatch[1]);
      let month = dob.getMonth(); // 0-based
      let day = dob.getDate();
      let year = dob.getFullYear();
      let started = startMatch ? startMatch[1] : "";

      people.push({
        name,
        surname,
        dob,
        month,
        day,
        year,
        started
      });
    }
  });

  let months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  let grouped = {};
  months.forEach((m, i) => grouped[i] = []);
  people.forEach(p => grouped[p.month].push(p));

  for (let m in grouped) grouped[m].sort((a, b) => a.day - b.day);

  // Build LaTeX document
  let tex = `
\\documentclass[10pt,a4paper]{article}
\\usepackage[margin=1.5cm]{geometry}
\\usepackage{multicol}
\\usepackage{titlesec}
\\usepackage{parskip}
\\setlength{\\columnsep}{0.1cm} % spacing between columns
\\setlength{\\parskip}{2pt} % compact spacing
\\pagenumbering{gobble}

\\begin{document}

% Title spanning full width and bold, 0.8cm spacing below
{\\centering {\\LARGE \\textbf{Africa Workers Birthday Calendar}} \\\\[0.8cm] \\par}

% Start 3-column layout
\\begin{multicols}{3}
\\raggedcolumns
`;

  // Add months and entries
  months.forEach((m, i) => {
    if (grouped[i].length > 0) {
      tex += `\\begin{samepage}\n`;
      // Centered month heading, font size Large
      tex += `\\begin{center}{\\Large \\textbf{${m}}}\\end{center}\n`;
      grouped[i].forEach(p => {
        const startedYear = p.started ? p.started : "----";
        // Left-aligned entry, font size small
        tex += `{\\small ${("0" + p.day).slice(-2)}/${p.year} \\textbf{${p.name} ${p.surname}} (${startedYear})} \\\\\n`;
      });
      tex += `\\end{samepage}\n\n`;
    }
  });

  tex += `
\\end{multicols}
\\end{document}
`;

  // Save the file in the specified folder with the new filename
  const folder = DriveApp.getFolderById("15-6hB7Eb3x6VYMQcUNUQkLZJvTX373jn");
  const fileName = "AfricaWorkersBirthdays - View.txt";
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    const file = files.next();
    file.setContent(tex);
  } else {
    folder.createFile(fileName, tex);
  }
}

function checkAndNotifyMissingPDFs() {

  const recipients = "mariusmarais2008@gmail.com,devfldinfo@gmail.com";
  const subject = "Addressbook PDF Generation Discrepancy Detected";

  if (!fldAddrTexFiles || !fldAddrPDFs) {
    Logger.log("Folder IDs not defined properly.");
    MailApp.sendEmail(
      recipients,
      "Script Error: Folder ID Missing",
      "One or both folder IDs (fldAddrTexFiles, fldAddrPDFs) are missing."
    );
    return;
  }

  try {

    const texFolder = DriveApp.getFolderById(fldAddrTexFiles);
    const pdfFolder = DriveApp.getFolderById(fldAddrPDFs);

    const texFiles = texFolder.getFiles();
    const missingFiles = [];

    while (texFiles.hasNext()) {

      const file = texFiles.next();
      const fileName = file.getName();

      // Only process files ending with " - View.txt"
      if (fileName.endsWith(" - View.txt")) {

        const baseName = fileName.replace(" - View.txt", "");

        const expectedViewPdf = baseName + " - View.pdf";
        //const expectedPrintPdf = baseName + " - Print.pdf";

        const viewPdfExists = pdfFolder.getFilesByName(expectedViewPdf).hasNext();
        //const printPdfExists = pdfFolder.getFilesByName(expectedPrintPdf).hasNext();

        if (!viewPdfExists) {
          missingFiles.push(expectedViewPdf);
        }
      }
    }

    // If discrepancies found, send email
    if (missingFiles.length > 0) {

      const body =
        "The following PDF files are missing:\n\n" +
        missingFiles.join("\n");

      MailApp.sendEmail(recipients, subject, body);

      Logger.log("Discrepancy detected. Email sent.");
    } else {
      Logger.log("All expected PDFs are present.");
    }

  } catch (e) {

    const errorMsg = `Error while checking files:\n${e.toString()}`;
    Logger.log(errorMsg);
    MailApp.sendEmail(
      recipients,
      "Error: Addressbook PDF Check Failed",
      errorMsg
    );
  }
}
