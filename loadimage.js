// vim: set tabstop=2 shiftwidth=2 expandtab:
// Copyright : Nicolas BOSSARD 2024
// licence : MIT
//
// This source file is aimed to be executed in a dataviewjs block
// It should be called with blocks like following :
// ```dataviewjs
// await dv.view("scripts/loadimage", '20240825_084033.jpg')
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

  // downloading the image...
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

loadimage(input)
