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
class Api {
  url: string;
  ajax: XMLHttpRequest;
  constructor(url: string) {
    this.url = url;
    this.ajax = new XMLHttpRequest();
  }

  protected getRequest<AjaxResponse>(): AjaxResponse {
    this.ajax.open('GET', this.url, false);
    this.ajax.send();

    return JSON.parse(this.ajax.response);
  }
}
class NewsFeedApi extends Api {
  getData(): NewsFeed[] {
    return this.getRequest<NewsFeed[]>();
  }
}
class NewsDetailApi extends Api {
  getData(): NewsDetail {
    return this.getRequest<NewsDetail>();
  }
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

class View {
  template: string;
  renderTemplate: string;
  container: HTMLElement;
  htmlList: string[];
  constructor(containerId: string, template: string) {
    const containerElement = document.getElementById(containerId);
    if (!containerElement) {
      throw '최상위 컨테이너가 없어 UI를 실행하지 못합니다.';
    }
    this.container = containerElement;
    this.template = template;
    this.htmlList = [];
  }
  updateView(): void {
    this.container.innerHTML = this.template;
  }
  addHtml(htmlString: string): void {
    this.htmlList.push(htmlString);
  }
  getHtml(): string {
    return this.htmlList.join('');
  }
  setTemplateData(key: string, value: string) {
    this.template = this.template.replace(`{{__${key}__}}`, value);
  }
}

class NewsFeedView extends View {
  api: NewsFeedApi;
  feeds: NewsFeed[];
  constructor(containerId: string) {
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
    super(containerId, template);
    this.api = new NewsFeedApi(NEWS_URL);
    this.feeds = store.feeds;

    if (this.feeds.length === 0) {
      this.feeds = store.feeds = this.api.getData();
      this.makeFeeds();
    }
  }
  render(): void {
    for (let i = (store.currentPage - 1) * store.pageView; i < store.currentPage * store.pageView; i++) {
      if (!this.feeds[i]) break;
      const { id, title, read, comments_count, user, points, time_ago } = this.feeds[i];
      this.addHtml(`
    <li class="p-6 ${read ? 'bg-gray-400' : 'bg-white'} mt-6 rounded-lg shadow-md tranition-colors duration-500 hover:bg-green-100">
      <section class="flex">
        <article class="flex-auto">
          <a href="#/show/${id}">${title}</a>
        </article>
        <article class="text-center text-sm">
          <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${comments_count}</div>
        </article>
      </section>
      <section class="flex mt-3">
        <article class="grid grid-cols-3 text-sm text-gray-500">
          <div class="mr-2"><i class="fas fa-user mr-1"></i>${user}</div>
          <div class="mr-2"><i class="fas fa-heart mr-1"></i>${points}</div>
          <div class="mr-2"><i class="fas fa-clock mr-1"></i>${time_ago}</div>
        </article>
      </section>
    </li>
  `);
    }

    this.setTemplateData('news_feed', this.getHtml());
    this.setTemplateData('prev_page', String(store.currentPage > 1 ? store.currentPage - 1 : 1));
    this.setTemplateData('next_page', String(this.feeds.length - store.pageView * store.currentPage > 0 ? store.currentPage + 1 : store.currentPage));
    this.updateView();
  }
  makeFeeds(): void {
    for (let i = 0; i < this.feeds.length; i++) {
      this.feeds[i].read = false;
    }
  }
}
class NewsDetailView extends View {
  constructor(containerId: string) {
    let template = `
  <div class="bg-gray-600 min-h-screen pd-8">
    <div class="bg-white text-xl">
      <div class="mx-auto px-4">
        <section class="flex justify-between items-center py-6">
          <header class="flex justify-start">
            <h1 class="font-extrabold">Heaker News</h1>
          </header>
          <article class="items-center justify-end">
            <a href="#/page/{{__currentPage__}}" class="text-gray-500">
              <i class="fa fa-times"></i>
            </a>
          </article>
        </section>
      </div>
    </div>
    <div class="h-full border rounded-xl bg-white m-6 p-4">
      <h2>{{__title__}}</h2>
      <section class="text-gray-400 h-20">{{__content__}}</section>
      {{__comments__}}
    </div>
  </div>
    `;
    super(containerId, template);
  }
  render(): void {
    const id = location.hash.substring(7);
    const api = new NewsDetailApi(CONTENT_URL.replace('@id', id));
    const newsDetail = api.getData();

    for (let i = 0; i < store.feeds.length; i++) {
      if (store.feeds[i].id === Number(id)) {
        store.feeds[i].read = true;
        break;
      }
    }

    this.setTemplateData('comments', this.makeComments(newsDetail.comments));
    this.setTemplateData('currentPage', String(store.currentPage));
    this.setTemplateData('title', newsDetail.title);
    this.setTemplateData('content', newsDetail.content);

    this.updateView('');
    this.updateView();
  }
  makeComments(comments: NewsComment[]): string {
    for (let i = 0; i < comments.length; i++) {
      const comment: NewsComment = comments[i];
      this.addHtml(`
      <div style="padding-left: ${comment.level * 30}px;" class="mt-4">
        <div class="text-gray-400">
          <i class="fa fa-sort-up mr-2"></i>
          <strong>${comment.user}</strong> ${comment.time_ago}
        </div>
        <p class="text-gray-700">${comment.content}</p>
       </div>
      `);

      if (comment.comments.length > 0) {
        this.addHtml(this.makeComments(comment.comments));
      }
    }

    return this.getHtml();
  }
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
