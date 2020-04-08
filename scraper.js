const fs = require('fs');
const colors = require('colors');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');

let scrapeData = async function scrapeData({
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
  await page.waitFor(1500);

  console.log(`\n${colors.underline("COVID-19 in " + regionName)}`);

  date = await getDate(page, datePath);
  covidCases = await getData("cases", page, covidCasesPath, covidDeathsPath);
  covidDeaths = await getData("deaths", page, covidCasesPath, covidDeathsPath);
  casesDiff = await previousCounts("cases", covidCases, date);
  deathDiff = await previousCounts("deaths", covidDeaths, date);
  await writeData(date, covidCases, covidDeaths, casesDiff, deathDiff);

  console.log(`${colors.gray(date)} \n${colors.red(covidCases)} cases \n${colors.brightRed(covidDeaths)} deaths \n`);
  console.log(`${colors.red(casesDiff)} more cases than yesterday \n${colors.brightRed(deathDiff)} more deaths than yesterday \n`);

  await browser.close();

  return [date, covidCases, covidDeaths, casesDiff, deathDiff];
}

async function getData(type, page, covidCasesPath, covidDeathsPath) {
  let jsPath;
  const casesJSPath = covidCasesPath;
  const deathsJSPath = covidDeathsPath;
  type === "cases" ? jsPath = casesJSPath : jsPath = deathsJSPath;
  const countElement = await page.$(jsPath);
  const countTxt = await (await countElement.getProperty("textContent")).jsonValue();
  const countArray = countTxt.split("");
  if (countArray[countArray.length - 1] === "*") {
    countArray.pop();
  }

  return parseInt(countArray.join(""));
}

async function getDate(page, datePath) {
  const dateElement = await page.$(datePath);
  const dateTxt = await (await dateElement.getProperty("textContent")).jsonValue();
  const dateFormatted = dateTxt.substring(0, dateTxt.indexOf(","));
  return dateFormatted;
}

function previousCounts(type, amount, date) {
  let data = fs.readFileSync("data.json", "utf-8");
  let jsonData = JSON.parse(data);
  if (Object.keys(jsonData[jsonData.length - 1])[0] === date) {
    if (type === "cases") {
      return jsonData[jsonData.length - 1][Object.keys(jsonData[jsonData.length - 1])]["changeInCases"];
    } else if (type === "deaths") {
      return jsonData[jsonData.length - 1][Object.keys(jsonData[jsonData.length - 1])]["changeInDeaths"];
    }
  } else {
    if (type === "cases") {
      let todayCasesCount = amount;
      let yesterdayCasesCount = jsonData[jsonData.length - 1][Object.keys(jsonData[jsonData.length - 1])]["positiveCases"];
      return todayCasesCount - yesterdayCasesCount;
    } else if (type === "deaths") {
      let todayDeathCount = amount;
      let yesterdayDeathCount = jsonData[jsonData.length - 1][Object.keys(jsonData[jsonData.length - 1])]["deathCount"];
      return todayDeathCount - yesterdayDeathCount;
    }
  }
}

function writeData(date, positiveCases, deathCount, changeInCases, changeInDeaths) {
  fs.readFile("data.json", function(err, data) {
    let jsonData = JSON.parse(data);
    if (date in jsonData[jsonData.length - 1]) {
      console.log(`Data for ${date} already exists, not writing to data file.`);
      return null;
    }
    jsonData.push({
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

function getArchivedData(type, date=null) {
  let data = fs.readFileSync("data.json", "utf-8");
  let jsonData = JSON.parse(data);
  if (type === "entryDates") {
    let dateOfEntries = [];
    for (var i = 1; i < jsonData.length; i++) {
      dateOfEntries.push(Object.keys(jsonData[i - 1]).join());
    }
    return dateOfEntries;
  } else if (type === "entry" && date) {
    for (var i = 0; i < jsonData.length; i++) {
      if (Object.keys(jsonData[i]) == date) {
        let positiveCases = jsonData[i][Object.keys(jsonData[i])]["positiveCases"];
        let deathCount = jsonData[i][Object.keys(jsonData[i])]["deathCount"];
        let changeInCases = jsonData[i][Object.keys(jsonData[i])]["changeInCases"];
        let changeInDeaths = jsonData[i][Object.keys(jsonData[i])]["changeInDeaths"];
        return [date, positiveCases, deathCount, changeInCases, changeInDeaths];
      }
    }
  } else if (type == "fetchLast") {
    let date = Object.keys(jsonData[jsonData.length - 1]).join();
    let positiveCases = jsonData[jsonData.length - 1][Object.keys(jsonData[jsonData.length - 1])]["positiveCases"];
    let deathCount = jsonData[jsonData.length - 1][Object.keys(jsonData[jsonData.length - 1])]["deathCount"];
    let changeInCases = jsonData[jsonData.length - 1][Object.keys(jsonData[jsonData.length - 1])]["changeInCases"];
    let changeInDeaths = jsonData[jsonData.length - 1][Object.keys(jsonData[jsonData.length - 1])]["changeInDeaths"];
    return [date, positiveCases, deathCount, changeInCases, changeInDeaths];
  }
}

module.exports.scrapeData = scrapeData;
module.exports.getArchivedData = getArchivedData;
