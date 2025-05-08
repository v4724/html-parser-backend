import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

function randomDelay(min = 2000, max = 5000) {
  const delayMs = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

app.use(cors());

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing ?url parameter' });

    try {
    // 延遲前一段時間以節流
    await randomDelay();
        
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';
      
    // 如果只想抓取特定的區塊（例如 class="content" 的區塊）
    const bookTitle = $('.product-detail-desc-title').text().trim();
    const previewImg = $('.product-detail-image-main > a > img ').attr('src');
    const reserve = $('.product-detail-label-item.mk-reserve').html();
    const stockSufficient = $('.stock_sufficient').html();
    const stockLittle = $('.stock_little').html();
    const outOfStock = $('.out_of_stock').html();
      
    let status = '', stock = '', statusDes = '';
    if (outOfStock) {
        status = '0';
        stock = '0';
        statusDes = 'out_of_stock';
    } else {
        if (reserve && stockSufficient) {
            status = '1';
            stock = '1';
            statusDes = 'reserve stock_sufficient';
        }else if (reserve && stockLittle) {
            status = '1';
            stock = '2';
            statusDes = 'reserve stock_little';
        }else if (!reserve && stockSufficient) {
            status = '2';
            stock = '1';
            statusDes = '!reserve stock_sufficient';
        }else if (!reserve && stockLittle) {
            status = '2';
            stock = '2';
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
    
    const shippingSchedule = [];
        $('#shippingScheduleDateArea>div').each((i, el) => { 
        let type = '', shippingDate = '';
        $(el).find('div').each((j, div) => { 
            if (j === 0) {
                type = i===0 ? '每度便' : $(div).text().trim();
            } else if (j === 1) {
                shippingDate = $(div).text().trim();
                shippingDate = shippingDate.substring(0, shippingDate.length - 2);
            }
        })
            shippingSchedule.push({
                type, shippingDate
            })
    })
      
    res.json({
      url,
      title,
        description,
        bookTitle,
        previewImg,
        status,
        stock,
        statusDes,
        bookSize,
        bookPages,
        price,
        shippingSchedule
        
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
