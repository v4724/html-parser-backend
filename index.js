import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
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
      
    // 如果只想抓取特定的區塊（例如 class="content" 的區塊）
    const bookTitle = $('.product-detail-desc-title').text().trim();
    const previewImg = $('.product-detail-image-main > a > img ').attr('src');
    let status = '', statusDes = '';
    const reserve = $('.product-detail-label-item.mk-reserve').html();
    const stockSufficient = $('.stock_sufficient').html();
    const stockLittle = $('.stock_little').html();
    const outOfStock = $('.out_of_stock').html();
    if (outOfStock) {
        status = '4';
        statusDes = 'out_of_stock';
    } else {
        if (reserve && stockSufficient) {
            status = '1';
            statusDes = 'reserve stock_sufficient';
        }else if (reserve && stockLittle) {
            status = '2';
            statusDes = 'reserve stock_little';
        }else if (!reserve && stockSufficient) {
            status = '3';
            statusDes = '!reserve stock_sufficient';
        }else if (!reserve && stockLittle) {
            status = '4';
            statusDes = '!reserve stock_little';
        }
    }
    let bookTypeAndSize;
    $('.product-detail-spec-table tr').each((i, el) => {
    
        let findSize = false;
        $(el)
        .find('td')
        .each((j, td) => {
            const text = $(td).text().trim();
            if (findSize) {
                bookTypeAndSize = text;
            }
            if (text.includes('種別/サイズ')) {
                findSize = true;
            }
        });
        if (findSize) {
            return false;
        }
        
    });
    bookTypeAndSize = bookTypeAndSize.split('/')[1].trim().replaceAll(' ', '');
    const tmpArr = bookTypeAndSize.split('\n\n');
    const bookSize = tmpArr[0];
    const bookPages = tmpArr[1];
    const price = $('.pricearea__price.pricearea__price--normal').html().split('円')[0].replaceAll(',', '');
      
    res.json({
      url,
      title,
        description,
        bookTitle,
        previewImg,
        status,
        statusDes,
        bookSize,
        bookPages,
        price
        
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
