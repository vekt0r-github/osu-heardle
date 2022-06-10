/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");
const util = require('util');
const request = require('request');
const get = util.promisify(request.get);

const { makeRng, random, getTime, weightedRandomChoice } = require('./mapsetUtils');

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

const MAX_ID = 1656675;

// router.get("/mapsets/graph", async (req, res) => {
//   const output = [];
//   for (let id = 1; id <= MAX_ID; id += Math.round(100 * (Math.log10(id) + 1)**2)) {
//     const x = await get({
//       url: `https://osu.ppy.sh/api/get_beatmaps`,
//       qs: {k: process.env.OSU_API_KEY, s: id},
//     });
//     const {body} = x;
//     console.log(`doing: ${id}`)
//     try { 
//       const content = JSON.parse(body);
//       if (!content || !content.length) throw Error;
//       const {submit_date} = content[0];
//       output.push([id, new Date(submit_date).valueOf()]);
//     } catch {
//       console.log(`failed: ${id}`)
//     }
//   }
//   res.status(200).send(output);
// });
  
router.get("/mapsets/random", async (req, res) => {
  // pick a random starting time that tries to follow distribution of ranked mapsets
  const {seed} = req.query;
  const rng = makeRng(seed);
  const randomId = random(rng)(1, MAX_ID + 1);
  const randomTime = getTime(randomId);
  // get 500 diffs ranked since that time
  request.get({
    url: `https://osu.ppy.sh/api/get_beatmaps`,
    qs: {
      k: process.env.OSU_API_KEY,
      since: randomTime,
      m: 0, // filter to standard; not strictly necessary
    },
  }, (error, response, body) => {
    try { 
      console.log(response)
      if (error || response.statusCode != 200) throw error;
      const content = JSON.parse(body);
      if (!content || !content.length) throw error;
      console.log(content)

      const mapsets = {}; // representative maps, rather
      for (const map of content) {
        const {approved, audio_unavailable} = map;
        if (+approved <= 0 || audio_unavailable != 0) continue; // unranked or dmca'd
        // 4 = loved, 3 = qualified, 2 = approved, 1 = ranked, 0 = pending, -1 = WIP, -2 = graveyard
        const {beatmapset_id, playcount} = map;
        if (!(beatmapset_id in map)) {
          mapsets[beatmapset_id] = map;
          map.weight = +playcount;
        } else {
          const otherMap = mapsets[beatmapset_id];
          otherMap.weight += +playcount; // will be used as a popularity metric
        }
      }
      const mapsetsList = Object.values(mapsets);
      const POPULARITY_WEIGHTING = 0.5; // more = favor more popular maps
      const weights = mapsetsList.map(set => Math.round(set.weight ** POPULARITY_WEIGHTING));
      const mapset = weightedRandomChoice(rng)(mapsetsList, weights);
      const {beatmapset_id: id, artist, artist_unicode, title, title_unicode} = mapset;
      const song = {
        id: id,
        path: `//b.ppy.sh/preview/${id}.mp3`,
        artist: artist,
        artistUnicode: artist_unicode ?? artist,
        title: title,
        titleUnicode: title_unicode ?? title,
        displayName: `${artist} - ${title}`,
        displayNameUnicode: `${artist_unicode ?? artist} - ${title_unicode ?? title}`,
      };
      const guessList = mapsetsList.map((set) => {
        const {artist, artist_unicode, title, title_unicode} = set;
        return {
          artist: artist,
          artistUnicode: artist_unicode ?? artist,
          title: title,
          titleUnicode: title_unicode ?? title,
        }
      });
      res.status(200).send({
        song: song,
        guessList: guessList,
      });
    } catch (e) {
      console.log(e)
      res.status(404).send({ msg: "mapset not found" });
    }
  });
})

router.get("/mapsets/:id", async (req, res) => {
  const id = req.params.id;
  request.get({
    url: `https://osu.ppy.sh/api/get_beatmaps`,
    qs: {k: process.env.OSU_API_KEY, s: id},
  }, (error, response, body) => {
    try { 
      if (error || response.statusCode != 200) throw Error;
      const content = JSON.parse(body);
      if (!content || !content.length) throw Error;
      const {approved, audio_unavailable} = content[0];
      if (+approved <= 0 || audio_unavailable != 0) throw Error; // unranked or dmca'd
      // 4 = loved, 3 = qualified, 2 = approved, 1 = ranked, 0 = pending, -1 = WIP, -2 = graveyard
      const {artist, artist_unicode, title, title_unicode} = content[0];
      res.status(200).send({
        id: id,
        path: `//b.ppy.sh/preview/${id}.mp3`,
        displayName: `${artist} - ${title}`,
        displayNameUnicode: `${artist_unicode ?? artist} - ${title_unicode ?? title}`,
      });
    } catch {
      res.status(404).send({ msg: "mapset not found" });
    }
  });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
