import express from 'express';
import { MongoClient } from 'mongodb'
import path from 'path';

const app = express();
// Middleware
app.use(express.static(path.join(__dirname, 'build')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })
    const db = client.db('my-blog')
    await operations(db)
    client.close()
  } catch (err) {
    res.status(500).json({ message: 'error', err })
  }
}
app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name
    const articleInfo = await db.collection('articles').findOne({ name: articleName })
    res.status(200).json(articleInfo)
  }, res)

})
app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name

    const articleInfo = await db.collection('articles').findOne({ name: articleName })
    await db.collection('articles').updateOne({ name: articleName }, {
      $set: {
        upvotes: articleInfo.upvotes + 1
      }
    })
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
    res.status(200).json(updatedArticleInfo)
  }, res)
})
app.post('/api/articles/:name/add-comment', (req, res) => {
  withDB(async (db) => {
    // from body
    const { username, text } = req.body
    // from url
    const articleName = req.params.name
    const articleInfo = await db.collection('articles').findOne({ name: articleName })
    await db.collection('articles').updateOne({ name: articleName }, {
      $set: {
        comments: [...articleInfo.comments, { username, text }]
      }
    })
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
    res.status(200).json(updatedArticleInfo)
  }, res)
})
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'))
})
// app.get('/hello', (req, res) => res.send('Hello!'))
// app.get('/hello/:name', (req, res) => res.send(`Hello! ${req.params.name}`))
// app.post('/hello', (req, res) => res.send(`Hello! ${req.body.name}`))
app.listen(8000, () => console.log('listening on port 8000'))