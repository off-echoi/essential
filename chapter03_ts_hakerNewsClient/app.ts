interface Store {
  currentPage: number;
  feeds: NewsFeed[];
  pageView: number;
}

interface News {
  readonly id: number;
  readonly time: number;
  readonly time_ago: string;
  readonly title: string;
  readonly url: string;
  readonly user: string;
  readonly type: string;
}
interface NewsFeed extends News {
  readonly comments_count: number;
  readonly domain: string;
  readonly points: number;
  read?: boolean;
}

interface NewsDetail extends News {
  readonly comments: NewsComment[];
  readonly comments_count: number;
  readonly content: string;
  readonly domain: string;
  readonly points: number;
}

interface NewsComment extends News {
  readonly content: string;
  readonly comments: [];
  readonly comments_count: number;
  readonly level: number;
}

const ajax: XMLHttpRequest = new XMLHttpRequest();

const container: Element | null = document.querySelector('#root');

const NEWS_URL = 'https://api.hnpwa.com/v0/news/1.json';
const CONTENT_URL = 'https://api.hnpwa.com/v0/item/@id/json';

const store: Store = {
  currentPage: 1,
  feeds: [],
  pageView: 4,
};

function getData<T>(url: string): T {
  ajax.open('GET', url, false);
  ajax.send();

  return JSON.parse(ajax.response);
}

function makeFeeds(feeds: NewsFeed[]): NewsFeed[] {
  for (let i = 0; i < feeds.length; i++) {
    feeds[i].read = false;
  }
  return feeds;
}

function updateView(html: string): void {
  if (container) {
    container.innerHTML = html;
  } else {
    console.error('최상위 컨테이너가 없어 실행할 수 없습니다.');
  }
}

function newsFeed(): void {
  let newsFeed: NewsFeed[] = store.feeds;
  const newsList = [];

  let template = `
  <div class="bg-gray-600 min-h-screen">
    <div class="bg-white text-xl">
      <header class="mx-auto px-4">
        <section class="flex justify-between items-center py-6">
          <h1 class="font-extrabold">Haker News</h1>
          <div class="items-center justify-end">
            <a href="#/page/{{__prev_page__}}" class="text-gray-500">Prev</a>
            <a href="#/page/{{__next_page__}}" class="text-gray-500">Next</a>
          </div>
        </section>
      </header>
    </div>
    <ul class="p-4 text-2xl text-gray-700">
      {{__news_feed__}}
    </ul>
  </div>
  `;

  if (newsFeed.length === 0) {
    newsFeed = store.feeds = makeFeeds(getData<NewsFeed[]>(NEWS_URL));
  }
  for (let i = (store.currentPage - 1) * store.pageView; i < store.currentPage * store.pageView; i++) {
    if (!newsFeed[i]) break;
    newsList.push(`
      <li class="p-6 ${newsFeed[i].read ? 'bg-gray-400' : 'bg-white'} mt-6 rounded-lg shadow-md tranition-colors duration-500 hover:bg-green-100">
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
  template = template.replace('{{__prev_page__}}', String(store.currentPage > 1 ? store.currentPage - 1 : 1));
  template = template.replace(
    '{{__next_page__}}',
    String(newsFeed.length - store.pageView * store.currentPage > 0 ? store.currentPage + 1 : store.currentPage)
  );
  updateView(template);
}

function newsDetail(): void {
  const id = location.hash.substring(7);

  const newsContent = getData<NewsDetail>(CONTENT_URL.replace('@id', id));

  let template = `
<div class="bg-gray-600 min-h-screen pd-8">
  <div class="bg-white text-xl">
    <div class="mx-auto px-4">
      <section class="flex justify-between items-center py-6">
        <header class="flex justify-start">
          <h1 class="font-extrabold">Heaker News</h1>
        </header>
        <article class="items-center justify-end">
          <a href="#/page/${store.currentPage}" class="text-gray-500">
            <i class="fa fa-times"></i>
          </a>
        </article>
      </section>
    </div>
  </div>
  <div class="h-full border rounded-xl bg-white m-6 p-4">
    <h2>${newsContent.title}</h2>
    <section class="text-gray-400 h-20">${newsContent.content}</section>
    {{__comments__}}
  </div>
</div>
  `;
  for (let i = 0; i < store.feeds.length; i++) {
    if (store.feeds[i].id === Number(id)) {
      store.feeds[i].read = true;
    }
  }

  updateView('');
  updateView(template.replace('{{__comments__}}', makeComments(newsContent.comments)));
}

function makeComments(comments: NewsComment[]): string {
  const commentString = [];
  for (let i = 0; i < comments.length; i++) {
    const comment: NewsComment = comments[i];
    commentString.push(`
    <div style="padding-left: ${comment.level * 30}px;" class="mt-4">
      <div class="text-gray-400">
        <i class="fa fa-sort-up mr-2"></i>
        <strong>${comment.user}</strong> ${comment.time_ago}
      </div>
      <p class="text-gray-700">${comment.content}</p>
     </div>
    `);

    if (comment.comments.length > 0) {
      commentString.push(makeComments(comment.comments));
    }
  }

  return commentString.join('');
}

function router(): void {
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
