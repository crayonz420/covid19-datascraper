const fs = require('fs');
const colors = require('colors');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');

let scrapeData = async function scrapeData({
  regionId: region,
  regionName: regionName,
  url: url,
  datePath: datePath,
  covidCasesPath: covidCasesPath,
  covidDeathsPath: covidDeathsPath
}) {
  puppeteerExtra.use(pluginStealth());
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process'
    ]
  });
  const page = await browser.newPage();

  await page.goto(url);
  await page.waitFor(3000);
  await page.screenshot({
    path: "debug.png"
  });

  console.log(`\n${colors.underline("COVID-19 in " + regionName)}`);

  latestData = await getLatestData({
    page: page,
    datePath: datePath,
    covidCasesPath: covidCasesPath,
    covidDeathsPath: covidDeathsPath
  });
  differenceData = await getDifference({
    region: region,
    date: latestData[0],
    covidCasesAmt: latestData[1],
    covidDeathsAmt: latestData[2]
  })

  await writeData(latestData[0], latestData[1], latestData[2], differenceData[0], differenceData[1], region);

  console.log(`${colors.gray(latestData[0])} \n${colors.red(latestData[1])} cases \n${colors.brightRed(latestData[2])} deaths \n`);
  console.log(`${colors.red(differenceData[0])} more cases than yesterday \n${colors.brightRed(differenceData[1])} more deaths than yesterday \n`);

  await browser.close();

  return [latestData[0], latestData[1], latestData[2], differenceData[0], differenceData[1]];
}

function getDifference({
  region: region,
  date: date = null,
  covidCasesAmt: covidCasesAmt,
  covidDeathsAmt: covidDeathsAmt
}) {
  let data = fs.readFileSync("data.json", "utf-8");
  let jsonData = JSON.parse(data);
  if (Object.keys(jsonData[region][jsonData[region].length - 1])[0] === date) {
    let differenceInCases = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["changeInCases"];
    let differenceInDeaths = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["changeInDeaths"];
    return [differenceInCases, differenceInDeaths];
  } else {
    let previousCasesAmt = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["positiveCases"];
    let previousDeathAmt = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["deathCount"];
    return [(covidCasesAmt - previousCasesAmt), (covidDeathsAmt - previousDeathAmt)];
  }
}

async function getLatestData({
  page: page,
  datePath: datePath,
  covidCasesPath: covidCasesPath,
  covidDeathsPath: covidDeathsPath
}) {
  const dateElement = await page.$(datePath);
  const dateTxt = await (await dateElement.getProperty("textContent")).jsonValue();
  const dateFormatted = dateTxt.substring(8, dateTxt.indexOf("w")).trim();

  const casesElement = await page.$(covidCasesPath);
  const casesTxt = await (await casesElement.getProperty("textContent")).jsonValue();
  const deathsElement = await page.$(covidDeathsPath);
  const deathsTxt = await (await deathsElement.getProperty("textContent")).jsonValue();

  return [dateFormatted, parseInt(casesTxt.trim()), parseInt(deathsTxt.trim())];
}

function getArchivedData(type, region = null, date = null) {
  let data = fs.readFileSync("data.json", "utf-8");
  let jsonData = JSON.parse(data);
  if (type === "entryDates" && region) {
    let dateOfEntries = [];
    for (var i = 1; i < jsonData[region].length; i++) {
      dateOfEntries.push(Object.keys(jsonData[region][i - 1]).join());
    }
    return dateOfEntries;
  } else if (type === "entry" && (date && region)) {
    for (var i = 0; i < jsonData[region].length; i++) {
      if (Object.keys(jsonData[region][i]) == date) {
        let positiveCases = jsonData[region][i][Object.keys(jsonData[region][i])]["positiveCases"];
        let deathCount = jsonData[region][i][Object.keys(jsonData[region][i])]["deathCount"];
        let changeInCases = jsonData[region][i][Object.keys(jsonData[region][i])]["changeInCases"];
        let changeInDeaths = jsonData[region][i][Object.keys(jsonData[region][i])]["changeInDeaths"];
        return [date, positiveCases, deathCount, changeInCases, changeInDeaths];
      }
    }
  } else if (type == "fetchLast" && region) {
    let date = Object.keys(jsonData[region][jsonData[region].length - 1]).join();
    let positiveCases = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["positiveCases"];
    let deathCount = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["deathCount"];
    let changeInCases = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["changeInCases"];
    let changeInDeaths = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["changeInDeaths"];
    return [date, positiveCases, deathCount, changeInCases, changeInDeaths];
  } else if (type == "fetchAllCasesPerDay" && region) {
    let cases = [];
    for (var i = 0; i < jsonData[region].length; i++) {
      cases.push(jsonData[region][i][Object.keys(jsonData[region][i])]["changeInCases"]);
    }
    return cases;
  }
}

function writeData(date, positiveCases, deathCount, changeInCases, changeInDeaths, region) {
  fs.readFile("data.json", function(err, data) {
    let jsonData = JSON.parse(data);
    if (date in jsonData[region][jsonData[region].length - 1]) {
      console.log(`Data for ${date} already exists, not writing to data file.`);
      return null;
    }
    jsonData[region].push({
      [date]: {
        positiveCases: parseInt(positiveCases),
        deathCount: parseInt(deathCount),
        changeInCases: parseInt(changeInCases),
        changeInDeaths: parseInt(changeInDeaths)
      }
    });
    fs.writeFile("data.json", JSON.stringify(jsonData, null, 2), "utf-8", function() {});
  });
  return null;
}

console.log(scrapeData({
    regionId: "alameda",
    regionName: "Alameda County",
    url: "https://ac-hcsa.maps.arcgis.com/apps/opsdashboard/index.html#/1e0ac4385cbe4cc1bffe2cf7f8e7f0d9",
    datePath: "body > div > div > div > div > div > div > margin-container > full-container > div:nth-child(2) > margin-container > full-container > div > div > p > em > span > strong",
    covidCasesPath: "body > div > div > div > div > div > div > margin-container > full-container > div:nth-child(4) > margin-container > full-container  > div > div > div > div > svg",
    covidDeathsPath: "body > div > div > div > div > div > div > margin-container > full-container > div:nth-child(5) > margin-container > full-container  > div > div > div > div > svg"
  }));

module.exports.scrapeData = scrapeData;
module.exports.getArchivedData = getArchivedData;

/* OLD CODE */

/*
async function getData(type, page, covidCasesPath, covidDeathsPath) {
  let jsPath;
  const casesJSPath = covidCasesPath;
  const deathsJSPath = covidDeathsPath;
  type === "cases" ? jsPath = casesJSPath : jsPath = deathsJSPath;
  const countElement = await page.$(jsPath);
  const countTxt = await (await countElement.getProperty("textContent")).jsonValue();
  await countTxt.trim();
  const countArray = countTxt.split("");
  if (countArray[countArray.length - 1] === "*") {
    countArray.pop();
  }

  return parseInt(countArray.join(""));
}

async function getDate(page, datePath) {
  const dateElement = await page.$(datePath);
  const dateTxt = await (await dateElement.getProperty("textContent")).jsonValue();
  const dateFormatted = dateTxt.substring(8, dateTxt.indexOf("w")).trim();
  return dateFormatted;
}
*/

/*
function previousCounts(type, amount, date) {
  let data = fs.readFileSync("data.json", "utf-8");
  let jsonData = JSON.parse(data);
  if (Object.keys(jsonData[region][jsonData[region].length - 1])[0] === date) {
    if (type === "cases") {
      return jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["changeInCases"];
    } else if (type === "deaths") {
      return jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["changeInDeaths"];
    }
  } else {
    if (type === "cases") {
      let todayCasesCount = amount;
      let yesterdayCasesCount = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["positiveCases"];
      return todayCasesCount - yesterdayCasesCount;
    } else if (type === "deaths") {
      let todayDeathCount = amount;
      let yesterdayDeathCount = jsonData[region][jsonData[region].length - 1][Object.keys(jsonData[region][jsonData[region].length - 1])]["deathCount"];
      return todayDeathCount - yesterdayDeathCount;
    }
  }
*/

/*
date = await getDate(page, datePath);
covidCases = await getData("cases", page, covidCasesPath, covidDeathsPath);
covidDeaths = await getData("deaths", page, covidCasesPath, covidDeathsPath);
casesDiff = await previousCounts("cases", covidCases, date);
deathDiff = await previousCounts("deaths", covidDeaths, date);
*/
