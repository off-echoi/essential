const ajax = new XMLHttpRequest();

const content = document.createElement('div');
const container = document.querySelector('#root');

const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id/json';

const store = {
  currentPage: 1,
  pageView: 9,
};

function getData(url) {
  ajax.open('GET', url, false);
  ajax.send();

  return JSON.parse(ajax.response);
}

function newsFeed() {
  const newsFeed = getData(NEWS_URL);

  const newsList = [];

  let template = `
  <div class="bg-gray-600 min-h-screen">
    <div class="bg-white text-xl">
      <header class="mx-auto px-4">
        <section class="flex justify-between items-center py-6">
          <h1 class="font-extrabold">Haker News</h1>
          <div class="items-center justify-end">
            <a href="#/page/{{__prev_page__}}" class="text-gray-500">PREV</a>
            <a href="#/page/{{__next_page__}}" class="text-gray-500">NEXT</a>
          </div>
        </section>
      </header>
    </div>
    <ul class="p-4 text-2xl text-gray-700">
      {{__news_feed__}}
    </ul>
  </div>
  `;

  for (let i = (store.currentPage - 1) * store.pageView; i < store.currentPage * store.pageView; i++) {
    if (!newsFeed[i]) break;
    newsList.push(`
      <li class="p-6 bg-white mt-6 rounded-lg shadow-md tranition-colors duration-500 hover:bg-green-100">
      <section class="flex">
        <article class="flex-auto">
          <a href="#/show/${newsFeed[i].id}">${newsFeed[i].title}</a>
        </article>
        <article class="text-center text-sm">
          <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${newsFeed[i].comments_count}</div>
        </article>
      </section>
      <section class="flex mt-3">
        <article class="grid grid-cols-3 text-sm text-gray-500">
          <div class="mr-2"><i class="fas fa-user mr-1"></i>${newsFeed[i].user}</div>
          <div class="mr-2"><i class="fas fa-heart mr-1"></i>${newsFeed[i].points}</div>
          <div class="mr-2"><i class="fas fa-clock mr-1"></i>${newsFeed[i].time_ago}</div>
        </article>
      </section>
    </li>
  `);
  }

  template = template.replace('{{__news_feed__}}', newsList.join(''));
  template = template.replace('{{__prev_page__}}', store.currentPage > 1 ? store.currentPage - 1 : 1);
  // FIXME: 다음 페이지 로직 고쳐야 함
  // TODO:
  template = template.replace(
    '{{__next_page__}}',
    (newsFeed.length - store.pageView * store.currentPage) % store.pageView > 0 ? store.currentPage + 1 : store.currentPage
  );
  container.innerHTML = template;
}

function newsDetail() {
  const id = location.hash.substring(7);

  const newsContent = getData(CONTENT_URL.replace('@id', id));

  container.innerHTML = '';

  container.innerHTML = ` 
  <h1>${newsContent.title}</h1>
  <div>
    <a href="#/page/${store.currentPage}">목록으로</a>
  </div>`;
}

function router() {
  const routePath = location.hash;

  if (routePath === '') {
    newsFeed();
  } else if (routePath.indexOf('page') >= 0) {
    store.currentPage = Number(routePath.substring(7));
    newsFeed();
  } else {
    newsDetail();
  }
}

window.addEventListener('hashchange', router);

router();
