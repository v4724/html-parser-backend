import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing ?url parameter' });

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';

    res.json({
      url,
      title,
      description
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch or parse page.' });
  }
});

app.get('/', (req, res) => {
  res.send('HTML Parser API is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
