// Netlify serverless function — securely returns GitHub token
// The token lives in Netlify Environment Variables, never in your files
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // Only allow requests from your own site
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      token: process.env.GITHUB_TOKEN
    })
  };
};
