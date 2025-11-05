import lunr from "C:\\Users\\antoine.quarroz\\Desktop\\LabDev\\pfpheds\\docs-site\\node_modules\\lunr\\lunr.js";
require("C:\\Users\\antoine.quarroz\\Desktop\\LabDev\\pfpheds\\docs-site\\node_modules\\lunr-languages\\lunr.stemmer.support.js")(lunr);
require("C:\\Users\\antoine.quarroz\\Desktop\\LabDev\\pfpheds\\docs-site\\node_modules\\lunr-languages\\lunr.fr.js")(lunr);
require("C:\\Users\\antoine.quarroz\\Desktop\\LabDev\\pfpheds\\docs-site\\node_modules\\lunr-languages\\lunr.multi.js")(lunr);
export const removeDefaultStopWordFilter = [];
export const language = ["fr","en"];
export const searchIndexUrl = "search-index{dir}.json";
export const searchResultLimits = 8;
export const fuzzyMatchingDistance = 1;