import { PlaywrightWebBaseLoader } from "langchain/document_loaders/web/playwright";
import { callParseChain } from "../langchain";

const list = [
  "https://web.archive.org/web/20220210235442/https://eaucongress.uroweb.org/",
  // "https://www.uaa2023.org/",
  // "https://onlinelibrary.wiley.com/toc/14422042/2019/26/S2",
  // "https://www.theisn.org/wcn/",
  // "http://www.iaunet.org/en/nd.jsp?id=178#_jcp=1",
  // "https://www.esdconference.com/",
  // "https://www.medcircle.cn/meetingapp/index/3970",
  // "http://kjuro2022.org/html/",
  // "https://www.fichier-pdf.fr/2018/10/23/programme-acelas-final-web/  ",
  // "https://www.eusc.ae/",
];

const committee = [
  "https://www.uaa2023.org/committee.php",
  "https://web.archive.org/web/20191002113259/http://uaa2019.com/general-information/organising-scientific-committee/",
  "https://www.theisn.org/wcn/about/local-organizing-working-group/",
  "http://www.iaunet.org/en/nd.jsp?id=178#_jcp=1",
  "https://www.esdconference.com/",
  "https://www.medcircle.cn/meetingapp/tpl1view/10541/3970",
  "http://kjuro2022.org/html/org.php",
  "https://www.fichier-pdf.fr/2018/10/23/programme-acelas-final-web/",
  "https://www.eusc.ae/eus-committee.php",
  "https://web.archive.org/web/20220315112258/https://www.33sua.com/",
];

const programme = [
  "https://scientific-programme.uroweb.org/EAU22",
  "https://www.uaa2023.org/program.php",
  "https://web.archive.org/web/20191002124933/http://uaa2019.com/programme/programme/",
  "https://cm.theisn.org/cmportal/searchable/WCN2023/config/programme#/cmcore",
  "http://www.iaunet.org/en/nd.jsp?id=179#fai_12_top",
  // "https://www.esdconference.com/files/esd_athens_22.pdf",
  "https://www.medcircle.cn/meetingapp/callist/cal2/3970",
  // "http://kjuro2022.org/img/pro/pro01.pdf",
  "https://www.fichier-pdf.fr/2018/10/23/programme-acelas-final-web/",
  "https://www.eusc.ae/program.php",
  "https://web.archive.org/web/20220525052925/https://33sua.com/agenda/",
];

const posters = [
  "https://www.sciencedirect.com/journal/european-urology/vol/81/suppl/S1",
  "https://onlinelibrary.wiley.com/toc/14422042/2019/26/S2",
  "https://www.sciencedirect.com/journal/kidney-international-reports/vol/8/issue/3/suppl/S",
  // "https://www.esdconference.com/files/ESD22_ABSTRACTS_MC.pdf",
  // "http://kjuro2022.org/img/pro/program.pdf",
];

const symposiums = [
  "https://scientific-programme.uroweb.org/EAU22",
  "https://www.theisn.org/wcn/wcn-supporters/industry-symposia/#industry-symposia-friday",
  // "http://kjuro2022.org/img/pro/pro03.pdf",
];

const hrefs = new Set();

(async () => {
  for (const url of list) {
    const loader = new PlaywrightWebBaseLoader(url, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: "domcontentloaded",
      },
      /** Pass custom evaluate, in this case you get page and browser instances */
      async evaluate(page, browser) {
        const results = await page.locator("body").allInnerTexts();

        return results.join();
      },
    });

    const docs = await loader.load();

    //   const results = await Promise.all(docs.map((doc) => callParseChain(doc)));

    console.log({ url, content: docs[0].pageContent.slice(0, 500) });
  }
})();
