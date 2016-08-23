(function () {
  var oauthSign = require("oauth-sign");

  var getNonce = function (length) {
   var possibleChars = "abcdefghijklmnopqrstuvwxyz012345679",
       token = "";

   for (var i = 0; i < length; i++) {
     token += possibleChars[Math.floor(Math.random() * possibleChars.length)];
   }

   return token;
 };

 var nonce = getNonce(32);
 var date = Math.round((new Date()).getTime() / 1000.0);

 var requestSignature = oauthSign.hmacsign(
   'GET',
   'https://oauth.withings.com/account/request_token',
   {
     oauth_callback: 'https://freeboard.io',
     oauth_consumer_key: 'db5f9cf67c599c27d4c47090ccb0fc4c859079170133b5c8526b38c8dd',
     oauth_nonce: nonce,
     oauth_signature_method: 'HMAC-SHA1',
     oauth_timestamp: date.toString(),
     oauth_version: '1.0'
  },
  "6d94873d42407b90c429e94f220042df4c9192429d75e5bfe2d20767ecc83fcd"
);

var wow = encodeURIComponent(requestSignature);

console.log("https://oauth.withings.com/account/request_token?oauth_callback=https%3A%2F%2Ffreeboard.io&oauth_consumer_key=db5f9cf67c599c27d4c47090ccb0fc4c859079170133b5c8526b38c8dd&oauth_nonce=" + nonce + "&oauth_signature=" + wow + "&oauth_signature_method=HMAC-SHA1&oauth_timestamp=" + date + "&oauth_version=1.0");

})();
