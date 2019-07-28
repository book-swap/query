/* eslint-disable no-underscore-dangle */
const express = require("express");
const axios = require("axios");
const convert = require("xml-js");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "tiny" : "dev"));
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://bookswap.ro"
        : "http://localhost:8080"
  })
);

// If the coverUrl is the default goodreads cover image, we remove it, otherwise we keep the cover.
const replaceDefaultCover = url =>
  url ===
  "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png"
    ? undefined
    : url;

const convertGoodreadsXmlResponseToJson = (xmlResponse, limit = 3) => {
  // We get the XML response from Goodreads and return it converted as JSON.
  const convertedResponse = convert.xml2js(xmlResponse.data, { compact: true })
    .GoodreadsResponse.search.results.work;

  // Don't do any further manipulation on this if the result was undefined.
  if (convertedResponse === undefined) return undefined;

  if (Array.isArray(convertedResponse)) {
    return convertedResponse
      .map(book => {
        // If the book has no cover, we remove the default goodreads image.
        const coverUrl = replaceDefaultCover(book.best_book.image_url._text);
        return {
          title: book.best_book.title._text,
          author: book.best_book.author.name._text,
          rating: book.average_rating._text,
          coverUrl
        };
      })
      .slice(0, limit); // We limit the response because of the vue interface.
  }
  // If the book has no cover, we remove the default goodreads image.
  const coverUrl = replaceDefaultCover(
    convertedResponse.best_book.image_url._text
  );
  return {
    title: convertedResponse.best_book.title._text,
    author: convertedResponse.best_book.author.name._text,
    rating: convertedResponse.average_rating._text,
    coverUrl
  };
};

const query = async (req, res, next) => {
  if (!req.query.q) {
    return res.status(400).json({ message: "Missing query params" });
  }
  try {
    const response = await axios.get(
      `https://www.goodreads.com/search/index?key=${process.env.GOODREADS_KEY}&q=${req.query.q}`
    );

    const json = convertGoodreadsXmlResponseToJson(response);
    if (json === undefined) res.status(404).json({ message: "Not found" });

    return res.send(json);
  } catch (error) {
    return next(error);
  }
};

// Routes
app.get("/", query);

// Error handler
app.use((err, req, res, next) => {
  // Log error message in our server's console
  console.error(process.env.NODE_ENV === "production" ? err.message : err);

  // If err has no specified error code, send status 500 'Internal Server Error'
  const statusCode = err.statusCode ? err.statusCode : 500;

  res.status(statusCode).json({ message: err.message });
  next();
});

module.exports = app;
