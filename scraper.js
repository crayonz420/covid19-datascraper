const fs = require('fs');
const colors = require('colors');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');

async function scraper() {
  puppeteerExtra.use(pluginStealth());
  const browser = await puppeteerExtra.launch({
    headless: true
  });
  const page = await browser.newPage();

  await page.goto("http://www.acphd.org/2019-ncov.aspx");
  await page.waitFor(1000);
  await page.screenshot({
    path: "debug.png",
    fullPage: true,
  });

  console.log(`\n${colors.underline("COVID-19 in Alameda County")}`);
  date = await getDate(page);
  covidCases = await getData("cases", page);
  covidDeaths = await getData("deaths", page);
  casesDiff = await previousCounts("cases", date);
  deathDiff = await previousCounts("deaths", date);
  console.log(`${colors.gray(date)} \n${colors.red(covidCases)} cases \n${colors.brightRed(covidDeaths)} deaths \n`);
  console.log(`${colors.red(casesDiff)} more cases than yesterday \n${colors.brightRed(deathDiff)} more deaths than yesterday \n`);

  await browser.close();
  await writeData(date, covidCases, covidDeaths, casesDiff, deathDiff);
}

async function getData(type, page) {
  let jsPath;
  const casesJSPath = "body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(3) > em:nth-child(1)";
  const deathsJSPath = "body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(3) > em:nth-child(3)";
  type == "cases" ? jsPath = casesJSPath : jsPath = deathsJSPath;
  const countElement = await page.$(jsPath);
  const countTxt = await (await countElement.getProperty("textContent")).jsonValue();
  const countArray = countTxt.split("");
  countArray.pop();

  return countArray.join("");
}

async function getDate(page) {
  const dateElement = await page.$("body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(2)");
  const dateTxt = await (await dateElement.getProperty("textContent")).jsonValue();
  const dateFormatted = dateTxt.substring(0, dateTxt.indexOf(","));
  return dateFormatted;
}

function previousCounts(type, date) {
  let data = fs.readFileSync("data.json", "utf-8");
  let jsonData = JSON.parse(data);
  let todayCasesCount = jsonData[jsonData.length - 1][date]["positiveCases"];
  let yesterdayCasesCount = jsonData[0][Object.keys(jsonData[0])]["positiveCases"];
  let todayDeathCount = jsonData[jsonData.length - 1][date]["deathCount"];
  let yesterdayDeathCount = jsonData[0][Object.keys(jsonData[0])]["deathCount"];
  if (type == "cases") {
    return todayCasesCount - yesterdayCasesCount;
  } else if (type == "deaths") {
    return todayDeathCount - yesterdayDeathCount;
  }
}

function writeData(date, positiveCases, deathCount, changeInCases, changeInDeaths) {
  fs.readFile("data.json", function(err, data) {
    let jsonData = JSON.parse(data);
    if (date in jsonData[jsonData.length - 1]) {
      console.log(`Data for ${date} already exists, not writing to data file.`);
      return "";
    }
    jsonData.push({
      [date]: {
        positiveCases: positiveCases,
        deathCount: deathCount,
        changeInCases: changeInCases,
        changeInDeaths: changeInDeaths
      }
    });
    fs.writeFile("data.json", JSON.stringify(jsonData, null, 2), "utf-8", function() {});
  });
}

scraper();
