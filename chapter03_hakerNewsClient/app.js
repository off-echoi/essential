const ajax = new XMLHttpRequest()

ajax.open('GET', 'https://api.hnpwa.com/v0/news/1.json', false)
ajax.send()

const newsFeed = JSON.parse(ajax.response)

document.getElementById('root').innerHTML = `<ul>
<li>${newsFeed[0].title}</li>
<li>${newsFeed[0].title}</li>
<li>${newsFeed[0].title}</li>
</ul>`
