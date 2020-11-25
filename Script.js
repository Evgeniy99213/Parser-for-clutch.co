const puppeteer = require('puppeteer')
const xlsx = require('xlsx')

const CATALOG_URL = 'https://clutch.co/web-developers'
const PAGES = 100

/** Selectors */
const LINK_SELECTOR = 'div.row.provider-row-header > div > h3 > a'
const NEXT_PAGE = '#block-system-main > div > div > div > section > div > div.row > div > div.text-center > ul > li.next > a'
const COMPANY_TITLE = '#summary_section > div > div.col-md-6.summary-description > div.field > h2'
const COMPANY_SHORT = '#summary_description__short > p'
const COMPANY_SIZE = '#summary_section > div > div.col-md-6.summary-description > div:nth-child(3) > div.col-md-3 > div > div:nth-child(3) > span'
const COMPANY_LOCATION = '#summary_section > div > div.col-md-3.offset-md-2 > div > div.field-location-name > span'
const COMPANY_PHONE = '#node-59924 > div.profile_sidebar > section > ul > li.quick-menu-details > a'
const COMPANY_URL = '#node-59924 > div.profile_sidebar > section > ul > li.website-link-a > a > href'


async function getLinks() {
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage()
    await page.goto(CATALOG_URL)

    const allURL = []
    await page.waitForSelector(LINK_SELECTOR)
    let alinks = await page.$$eval(LINK_SELECTOR, all => all.map(a => a.href))

    allURL.push(alinks)

    for (let i = 0; i < PAGES; i++) {
        await page.waitForSelector(NEXT_PAGE)
        let OK = await page.click(NEXT_PAGE)

        await page.waitForSelector(LINK_SELECTOR)
        let links = await page.$$eval(LINK_SELECTOR, all => all.map(a => a.href))
        const wait = (Math.floor(Math.random() * 5)) * 1000
        await page.waitFor(wait)
        allURL.push(links)
    }

    let lists = allURL.flat()
    console.log(lists)
    return lists
}


async function crawl(url, page) {
    await page.goto(url, {timeout: 20000})
    .catch(err => console.log(err))

    const company = await page.$eval(COMPANY_TITLE, name => name.textContent)
    .catch(err => console.log(`Company title is not found ${err}`))

    const location = await page.$eval(COMPANY_LOCATION, loc => loc.textContent)
    .catch(err => console.log(`Company location is not found ${err}`))

    const site = await page.$$eval(COMPANY_URL, all => all.map(a => a.href))
    .catch(err => console.log(`Company link is not found ${err}`))
    const link = site.toString()

    const description = await page.$eval(COMPANY_SHORT, short => short.textContent)
    .catch(err => console.log(`Company short description is not found ${err}`))

    const size = await page.$eval(COMPANY_SIZE, size => size.textContent)
    .catch(err => console.log(`Company size is not found ${err}`))

    const call = await page.$eval(COMPANY_PHONE, phone => phone.textContent)
    .catch(err => console.log(`Company phone is not found ${err}`))

    return {
        company,
        location,
        size,
        call,
        link,
        description
    }
}

async function main() {
    const allLinks = await getLinks()
    const browser = await puppeteer.launch() 
    const page = await browser.newPage()

    const db = []

    for(let link of allLinks) {
        const data = await crawl(link, page)
        const secondToWait = (Math.floor(Math.random() * 5)) * 1000
        await page.waitFor(secondToWait)  
        db.push(data)
    }
    
    console.log(db)
    getTable(db)
    await browser.close()
} 

function getTable(db){
    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.json_to_sheet(db)
    xlsx.utils.book_append_sheet(wb,ws)
    xlsx.writeFile(wb,"db.xlsx")
}

//Call a root-function
main()

