/*
 ********************************
 * Server addresses to connect  *
 ********************************
 */

// server address of the Virtuoso triple store
// const serverGetCommentsReviewers = "http://localhost:8081/sparql/commentsByReviewers";
const serverGetCommentsReviewers = "http://linkflows-app.nanopubs.lod.labs.vu.nl/sparql/commentsByReviewers";

// const serverGetCommentsSection = "http://localhost:8081/sparql/commentsBySection";
// const serverGetSections = "http://localhost:8081/sparql/mainSections";
const serverGetCommentsSection = "http://linkflows-app.nanopubs.lod.labs.vu.nl/sparql/commentsBySection";
const serverGetSections = "http://linkflows-app.nanopubs.lod.labs.vu.nl/sparql/mainSections";


/*
 ***************************************
 * Dimensions and colors used for them *
 ***************************************
 */

// definition of dimensions used in the grouped stacked chart
var dimensions = {
  "part" : ["article","section","paragraph"],
  "aspect" : ["syntax","style","content"],
  "positivity_negativity" : ["negative", "neutral", "positive"],
  "impact" : ["I1", "I2", "I3", "I4", "I5"],
  "action_needed" : ["compulsory", "suggestion", "no_action"]
}

// palette of colors used for all dimensions
var colors = {article: "#cd853f", section: "#deb887", paragraph: "#ffe4c4",
  syntax: "#c6deff", style: "#82cafa", content:"#9e7bff",
  negative: "#ff0000", neutral: "#ffff00", positive: "#008000",
  I1: "rgba(0, 0, 0, 0)", I2: "rgba(0, 0, 0, 0.25)", I3: "rgba(0, 0, 0, 0.5)", I4: "rgba(0, 0, 0, 0.75)", I5: "rgba(0, 0, 0, 1)",
  compulsory: "#ff6500", suggestion: "#ffa500", no_action: "#ffd700"};

/*
 ******************************************
 * Data variables for Virtuoso results *
 ******************************************
 */

// array containing the results retrieved from Virtuoso
var resultsVirtuoso = [];

// array containing the results retrieved from Virtuoso, without the prefixes
var resultsNoPrefixes = [];

/*
 ******************************************
 * Patterns used for the Virtuoso results *
 ******************************************
 */

// article level
var patternArticle = /.*\#article/;
var patternSection = /.*\#section$/;
var patternParagraph = /.*\#paragraph$/;
var articleLevel = "";

// aspect
var patternSyntax = /.*\#SyntaxComment$/;
var patternStyle = /.*\#StyleComment$/;
var patternContent = /.*\#ContentComment$/;
var aspect = "";

// positivity/negativity
var patternNegative = /.*\#NegativeComment$/;
var patternNeutral = /.*\#NeutralComment$/;
var patternPositive = /.*\#PositiveComment$/;
var pos_neg = "";

// impact
var impact = "";

// action needed
var patternCompulsory = /.*\#ActionNeededComment$/;
var patternSuggestion = /.*\#SuggestionComment$/;
var patternNoAction = /.*\#NoActionNeededComment$/;
var actionNeeded = "";
