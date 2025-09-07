module.exports.config = {
 name: "sad",
 version: "1.0.0",
 hasPermssion: 2,
 credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
 description: "hot video",
 commandCategory: "admin",
 usages: "horny vedio",
 cooldowns: 5,
 dependencies: {
 request: '',
 "fs-extra": '',
 axios: ''
 }
};

module.exports.run = async function({ api, event }) {
 const request = global.nodemodule["request"];
 const fs = global.nodemodule["fs-extra"];
var videoLinks = [
"https://drive.google.com/uc?export=download&id=10srxhZa-VS6dQPZUEKbjBHFe9cibWwEA",
"https://drive.google.com/uc?export=download&id=1Z9wmpUoOEcSFcBAz4hpTyON2RqajW9rg",
"https://drive.google.com/uc?export=download&id=1XcwsrCgJ3YYv1SUgJQeU9jDLeSbn_alt",
"https://drive.google.com/uc?export=download&id=1Nd3nZ4TjfecxQOTAFeXSTEMG0WBdtVYU",
"https://drive.google.com/uc?export=download&id=1gJwa6fhc5b7-S1Z5Vxyf5SkmSNLnxEI_",
"https://drive.google.com/uc?export=download&id=1tg9ys4PVz9xEzwWZ_BCTdQa_CY3aFRm4",
"https://drive.google.com/uc?export=download&id=1fIgpGHl2YfvJF9YU5O55XTduD-WgyCmO",
"https://drive.google.com/uc?export=download&id=1cnRC-CYntb8iIYeLafHDnhTHqx4KhoJf",
"https://drive.google.com/uc?export=download&id=1SUVurwWQZfinVlu8d8sloT6qk-as21_R",
"https://drive.google.com/uc?export=download&id=1n0x-PUF2AI9uDGgzpNUIx-Ub2cPmakPP",
"https://drive.google.com/uc?export=download&id=12mGIUEs8lgjZT-gb9Uwee1uZm6TJqsNB",
"https://drive.google.com/uc?export=download&id=15p2UF11MR7eGBFDpLCylxfg71PrijPWe",
"https://drive.google.com/uc?export=download&id=1cuGXIGvtqEfHfMXhQrC9G6GuEoevoEHW",
"https://drive.google.com/uc?export=download&id=18HS93ftltVPr3wBtz3ilqbtoKoDcD7go",
"https://drive.google.com/uc?export=download&id=1_2IDqxzOwzh_2NBf9qKhsucDQTMYOsbT",
"https://drive.google.com/uc?export=download&id=14dR1oGZllr41G67UhvLZDS3QSpxoyRj8",
"https://drive.google.com/uc?export=download&id=1KxSzi7lHmcXAhaXrAjTvsfXxcj1MKGyA",
"https://drive.google.com/uc?export=download&id=19Ceb3FXrztBwuwKIIvQA3a4Utd8bUM1X",
"https://drive.google.com/uc?export=download&id=1TCV1ByADTjbIfV4_92FVuO891vOhcCFy",
"https://drive.google.com/uc?export=download&id=1bBZMzlTE8kCelOx00sYO7XBWFz45z1Kd",
"https://drive.google.com/uc?export=download&id=1n5LRVzCTm1oD9jJb1by7dkOIUcOHv1YF",
"https://drive.google.com/uc?export=download&id=1VgzfcocG-0wu5TZS-UIt8mCWoeFFSkMu",
"https://drive.google.com/uc?export=download&id=1lffQoBck0Z9vmE3J_sSwqXQERxT3s7Cj",
"https://drive.google.com/uc?export=download&id=1avrADmp98C_m875B8Fd-ifQGzaf2iRCr",
"https://drive.google.com/uc?export=download&id=1M0I0Ym0i5w6B7ckTR4y9SRR7wshuNqod",
"https://drive.google.com/uc?export=download&id=1VHaRQYYwCssbGgQ1clvnZLtEpkhTFI6j",
"https://drive.google.com/uc?export=download&id=1N84oimJM4UGcauqM-zS61yW8UmMGH4NV",
"https://drive.google.com/uc?export=download&id=1aBkBe_je9JuHB2IkI-EtlNFA7JNFRql1",
"https://drive.google.com/uc?export=download&id=1rcdilATYkq8YZHBSGHOakttaLn_akDTP",
"https://drive.google.com/uc?export=download&id=1q8IGwnqzHejiqI73NBReM6LCkVVSy3rm",
"https://drive.google.com/uc?export=download&id=1_GNTMms6y7R_2vp_oVbVhAtoiX_zV7mK",
"https://drive.google.com/uc?export=download&id=1gKpwtgOIxaRxzwODGBx-F4Fz2E84usiX",
"https://drive.google.com/uc?export=download&id=1E-3nIaRpySOKPdoDk_uChVqkZSpX2QEq",
"https://drive.google.com/uc?export=download&id=1_almrSaU7TjV3kVif-VG_GiYEL2Sv8ay",
"https://drive.google.com/uc?export=download&id=1llhIbDWx9UGChwlxDSgpYDp5Fl8iMiqd",
"https://drive.google.com/uc?export=download&id=1HiSiCv5vtzhuJqPbAJQ8u1COZ1bAfh2S",
"https://drive.google.com/uc?export=download&id=1VXsHlWr5oZfIvcrUeGZ1iWQofYtxuFUU",
"https://drive.google.com/uc?export=download&id=1GZC1jNNx1sFHiv5NfIYlb1HdWL3Wl_YD",
"https://drive.google.com/uc?export=download&id=19xeVMLex0Mv3sDnRTzENEtjcYxoqvoYR",
"https://drive.google.com/uc?export=download&id=1zBXnBMC-Yy1lsbvkIJAVxxXkXwKh5JXk",
"https://drive.google.com/uc?export=download&id=1Cjkotl8gAsWygqaS2Mh9B00pfb62uS26",
"https://drive.google.com/uc?export=download&id=14t6fXFM_6EU_DsVqFv2Yi6qHlOt0kl44",
"https://drive.google.com/uc?export=download&id=1lxeAOsI_nNtnn_qF_0mGnxjW7OHR5nnc",
"https://drive.google.com/uc?export=download&id=1BzonBaxBnZF2Hkq_5oolCgup24Edfo_3",
"https://drive.google.com/uc?export=download&id=15MWnIkerQC9zwZyondtginYfwROdWoro",
"https://drive.google.com/uc?export=download&id=15ZoRwME67t-fmeBWI8vco5HQgEaJTEPy",
"https://drive.google.com/uc?export=download&id=14Gb56b3sosdggEtwlCz2xhR9ZNLIyT87",
"https://drive.google.com/uc?export=download&id=1b0Bapju4mmOqs5DDeF1dwtb-GP0BXCJ6",
"https://drive.google.com/uc?export=download&id=1u7uebZZy1tObHrPVkkH0w4elq-JUhyeX",
"https://drive.google.com/uc?export=download&id=1pTw86nsj0xAUqq7UgdXV8SGhrH0-BFOm",
"https://drive.google.com/uc?export=download&id=1nwdvjRhB-ugqL2AHM7YDwZBUuxzb22LC",
"https://drive.google.com/uc?export=download&id=1QHcTDvrOWRtzjEsWf-U0aqjvcXAsV7ma",
"https://drive.google.com/uc?export=download&id=1aJi0rsuecFgqr1bFXKw2ZVPsHUfv_POL",
"https://drive.google.com/uc?export=download&id=1HtESWKuf9C8oXJU2vlOh4gL8uu-INLrS",
"https://drive.google.com/uc?export=download&id=1QnBXK9S9owbEc4BEgC6q6FFbFqOf_m2w",
"https://drive.google.com/uc?export=download&id=1RsMAfuQ1mLAPesfj8SE2E5jlrvyy1nMm",
"https://drive.google.com/uc?export=download&id=13qr3xtmsuHHRq0IsoKpZBQDx3KhI-ML_",
"https://drive.google.com/uc?export=download&id=1auxUayraodonevh5htuAHZepp0MKkanY",
"https://drive.google.com/uc?export=download&id=1vO7AostbLbDNQjqw18yP9IbD5j5lgBpZ",
"https://drive.google.com/uc?export=download&id=18XES0vJ4Hzxcrb6bsXKP2CJtAf8x8OJP",
"https://drive.google.com/uc?export=download&id=1n2cnVb9S6EFJ3rqBsHyGnFjl6rz_MOwq",
"https://drive.google.com/uc?export=download&id=1gfPdELtC6B5pYzc5pFOF_lhrlotPdmcY",
"https://drive.google.com/uc?export=download&id=1D2z2v-_3Onc-gPe0v6eyhf0alY7tXw7x",
"https://drive.google.com/uc?export=download&id=1G1bDOdz-YWyOYbUOpzVqGL9rqPh7nGFx",
"https://drive.google.com/uc?export=download&id=15z3NlSVSSBqXEeR3rD4EryuQos8qM8TB",
"https://drive.google.com/uc?export=download&id=1BE_pA_P8G0PWf8A8rVJC2UcISFhpYEMd",
"https://drive.google.com/uc?export=download&id=1Tc49OifkAraoPFNv_i3WhdNmN0VwyauQ",
"https://drive.google.com/uc?export=download&id=1JJDAE6Z8hwMywXCQpKY0k5gsraWZHH5s",
"https://drive.google.com/uc?export=download&id=1gooJ0cdAZJ6iMX52frRTP2uAgAiQnCnb",
"https://drive.google.com/uc?export=download&id=18yydUzPJ8MuzsmUqCThChw3xMEYBU0CP",
"https://drive.google.com/uc?export=download&id=10lHhF-7xdFHwjeKDKNzfM_gG3JT2Lkrt",
"https://drive.google.com/uc?export=download&id=1dBmIOFSdCyD8O8Bi_vofWpgX0h7xs4Ky",
"https://drive.google.com/uc?export=download&id=1Qa9_1Vm7m0wv9TaBBd6rEnLN6-i2gXSs",
"https://drive.google.com/uc?export=download&id=1FAVu9VY9kY7rS3jMIUNX5WAzYwrP_yTL",
"https://drive.google.com/uc?export=download&id=1O6qyK_uscxXNOittXT4L7TM-xJ7QYuX4",
];
 

 const path = __dirname + "/cache/hotvideo.mp4";
 const randomLink = videoLinks[Math.floor(Math.random() * videoLinks.length)];

 request(encodeURI(randomLink))
 .pipe(fs.createWriteStream(path))
 .on("close", () => {
 api.sendMessage({
 body: "My hero Kingdom of heaven ✡️",
 attachment: fs.createReadStream(path)
 }, event.threadID, () => fs.unlinkSync(path));
 });
};
