// vim: set tabstop=2 shiftwidth=2 expandtab:
// Copyright : Nicolas BOSSARD 2024
// licence : MIT
//
// This source file is aimed to be executed in a dataviewjs block
// It should be called with blocks like following :
// ```dataviewjs
// await dv.view("scripts/loaddailyimage")
// ```

console.log(`Loading loadimage`);

// This function will retrieve and insert an image
// using an authorization header with basic auth content
// this is required because basic syntax like "http://username:password@example.com"
//
// args should contain an object with field 'filename' for example {filename: 'PXL_20240812_025800436.jpg'}
async function loadimage(parFilename) {
  console.log('loadimage is called with args : ', parFilename);
  let imageUrl = "https://mblancieux.ovh/photos/mini/" + parFilename;
  let imageUrlFull = "https://mblancieux.ovh/photos/" + parFilename;
  console.log('image to be downloaded mini is : ' + imageUrl);
  console.log('image to be downloaded full size is : ' + imageUrlFull);

  const headers={"Authorization":"Basic bmJvc3NhcmQ6dG90bw=="};

  // downloading the mini image...
  try {
    let data=await requestUrl({"url":imageUrl, headers});
    let base64Image = await new Promise((resolve) =>
      { let reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(new Blob([data.arrayBuffer]));
      });

    dv.paragraph(`[zoom](${imageUrlFull})`);
    // assuming the image is in JPEG format
    // Embed the image in a markdown string
    dv.paragraph(`![](data:image/jpeg;base64,${base64Image})`);
  } catch (error) {
    // can occur in case of 404 Not found for example
    // especially when the mini image is missing
    dv.paragraph(`💣 Failed to load mini image.`);
    // downloading the full size image...
      try {
        let data=await requestUrl({"url":imageUrlFull, headers});
        let base64Image = await new Promise((resolve) =>
          { let reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(new Blob([data.arrayBuffer]));
          });

        dv.paragraph(`[zoom](${imageUrl})`);
        // assuming the image is in JPEG format
        // Embed the image in a markdown string
        dv.paragraph(`![](data:image/jpeg;base64,${base64Image})`);
        dv.paragraph("_image full size_");
      } catch (error) {
        // can occur in case of 404 Not found for example
        dv.paragraph(`💣 Failed to load image. error: ${error}`);

      }
  }
}

// This function will retrieve and insert an image
// using an authorization header with basic auth content
// this is required because basic syntax like "http://username:password@example.com"
//
// args should contain an object with field 'filename' for example {filename: 'PXL_20240812_025800436.jpg'}
async function loaddailyimages() {
  const headers={"Authorization":"Basic bmJvc3NhcmQ6dG90bw=="};


  console.log("filename : " + dv.currentFilePath);
  // Extract the date portion using a regular expression
  const dateMatch = dv.currentFilePath.match(/\d{4}-\d{2}-\d{2}/);

  let curDay = "";
  if (dateMatch) {
    // Remove the hyphens from the date
    curDay = dateMatch[0].replace(/-/g, '');
    console.log(curDay); // Outputs: 20240916
  } else {
    console.log("No valid date found in the string");
  }


  console.log(`Downloading images list...`);

  // downloading the image list...
  let htmlBody;
  let data;
  let filenames = [];
  try {
    data=await requestUrl({"url":"https://mblancieux.ovh/photos/", headers});
    htmlBody = data.text;

    // console.log(`htmlBody : ${htmlBody}`);

    // doc contains lines like :
    // <a href="IMG_20240907_101303.jpg">IMG_20240907_101303.jpg</a> 2024-09-07 10:14  3.2M  <img src="/__ovh_icons/image2.gif" alt="[IMG]">
    const regex = /<a href="([0-9]{8}.+\..+)">.*<\/a>/g;
    let match;


    // use a regex to extract photos filenames
    while ((match = regex.exec(htmlBody)) !== null) {
        filenames.push(match[1]);
    }
    // console.log(`Images list before filter: ${filenames}`);

    // keep only those starting by filename day
    filenames = filenames.filter(filename => filename.startsWith(curDay));

    console.log(`Images list after filter: ${filenames}`);

    // message if no image left
     if (filenames.length === 0) {
      dv.paragraph(`ℹ️ pas d'image pour ${curDay}`);
      return;
    }

    for (let i = 0; i < filenames.length; i++) {
      loadimage(filenames[i], false);
    }

  } catch (error) {
    // can occur in case of 404 Not found for example
    dv.paragraph(`💣 Failed to load images list. error: ${error}`);
  }

}

loaddailyimages()
