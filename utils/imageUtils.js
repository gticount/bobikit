const sharp = require('sharp');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const axios = require('axios');
const util = require('util');

const { Readable } = require('stream');

function getFilename(index, id, type, userId, main, format) {
  const x = `public/${type}:${id}-user:${userId}-index:${index}-${main}.${format}`;
  return x;
}

const createHeader = () => {
  const header = {
    Authorization: `Bearer ${process.env.DROPBOX_TOKEN}`,
    'Content-Type': 'application/json',
  };
  return header;
};

const sharingOptions = (path) => {
  const options = {
    path: path,
    settings: {
      access: 'viewer',
      allow_download: true,
      audience: 'public',
      requested_visibility: 'public',
    },
  };
  return options;
};

const getSharablelink1 = async (path) => {
  const headers = createHeader();
  const settings = sharingOptions(path);
  const result = await axios.post(
    'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
    settings,
    { headers },
  );
  return result;
};

const getSharablelink = (path) =>
  new Promise((resolve, reject) => {
    getSharablelink1(path)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });

const upload = async (path, stream) => {
  let returnmaterial;
  const headers = {
    Authorization: `Bearer ${process.env.DROPBOX_TOKEN}`,
    'Content-Type': 'application/octet-stream',
    'Dropbox-API-Arg': JSON.stringify({
      path: path,
      mode: 'overwrite',
    }),
  };
  const uploadUrl = 'https://content.dropboxapi.com/2/files/upload';
  await axios
    .post(uploadUrl, stream, { headers })
    .then(async (res) => {
      const link = await getSharablelink(res.data.path_display);
      const updatedLink = await link.data.url.replace('&dl=0', '&raw=1');
      returnmaterial = updatedLink;
    })
    .catch((err) => console.log(err));
  return returnmaterial;
};

exports.resizePhotos = catchAsync(async (req, res, next) => {
  if (!req.file && !req.files) return next();

  if (req.files) {
    const updatePost = { cover: '', content: [] };
    const uploadingLinkToDataBase = (para1, para2) => {
      if (para1 === 'cover') {
        updatePost.cover = para2;
      }
      if (para1 === 'content') {
        updatePost.content = [...updatePost.content, para2];
      }
    };

    //     first upoad    ///

    const profilefilename = getFilename(
      0,
      req.params.postId,
      'post',
      req.user._id.toString(),
      'profile',
      'jpg',
    );
    const filePathProfile = `/post/image/${profilefilename}`;

    const bufferProfile = await sharp(req.files[0].buffer)
      .resize(300, 300)
      .toBuffer();

    const Stream = Readable.from(bufferProfile);
    const updatedLink = await upload(filePathProfile, Stream);
    const done = await uploadingLinkToDataBase('cover', updatedLink);

    await new Promise((resolve) => setTimeout(resolve, 1 * 1000));

    //further uploads

    for (const [index, el] of req.files.entries()) {
      const mainfilename = getFilename(
        index,
        req.params.postId,
        'post',
        req.user._id.toString(),
        'main',
        'jpg',
      );

      const filePathMain = `/post/image/${mainfilename}`;
      const bufferMain = await sharp(req.files[index].buffer)
        .resize(500, 600)
        .toBuffer();

      const StreamEach = Readable.from(bufferMain);

      const updatedLinkEach = await upload(filePathMain, StreamEach);

      const doneEach = await uploadingLinkToDataBase(
        'content',
        updatedLinkEach,
      );
      await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
    }
    req.body = updatePost;
  } else {
    if (req.params.storyId) {
      const StoryLinker = { content: '' };
      const uploadingLinkToDataBase = (para1) => {
        StoryLinker.content = para1;
      };
      const profilefilename = getFilename(
        0,
        req.params.storyId,
        'story',
        req.user._id.toString(),
        'all',
        'jpg',
      );
      const filePathProfile = `/story/image/${profilefilename}`;

      const bufferProfile = await sharp(req.file.buffer)
        .resize(300, 300)
        .toBuffer();

      const Stream = Readable.from(bufferProfile);

      const updatedLink = upload(filePathProfile, Stream);
      const done = await uploadingLinkToDataBase(updatedLink);

      await new Promise((resolve) => setTimeout(resolve, 1 * 1000));

      req.body = StoryLinker;
    } else if (req.params.messageId) {
      const MessageLinker = { content: '' };
      const uploadingLinkToDataBase = (para1) => {
        MessageLinker.content = para1;
      };
      const profilefilename = getFilename(
        0,
        req.params.messageId,
        'message',
        req.user._id.toString(),
        'all',
        'jpg',
      );
      const filePathProfile = `/message/image/${profilefilename}`;

      const bufferProfile = await sharp(req.file.buffer)
        .resize(150, 300)
        .toBuffer();

      const Stream = Readable.from(bufferProfile);

      const updatedLink = await upload(filePathProfile, Stream);

      const done = await uploadingLinkToDataBase(updatedLink);

      await new Promise((resolve) => setTimeout(resolve, 1 * 1000));

      req.body = MessageLinker;
    } else {
      const updater = { photo: '', smallPhoto: '', largePhoto: '' };
      const normalPhoto = getFilename(
        `${Date.now()}`,
        `myphoto`,
        'profile',
        req.user._id.toString(),
        'photo',
        'jpg',
      );
      const smallPhoto = getFilename(
        `${Date.now()}`,
        'myphoto',
        'profile',
        req.user._id.toString(),
        'small',
        'jpg',
      );
      const largePhoto = getFilename(
        `${Date.now()}`,
        'myphoto',
        'profile',
        req.user._id.toString(),
        'large',
        'jpg',
      );
      const normalFilePath = `/user/${normalPhoto}`;
      const smallFilePath = `/user/${smallPhoto}`;
      const largeFilePath = `/user/${largePhoto}`;

      const normalBuffer = await sharp(req.file.buffer)
        .resize(500, 500)
        .toBuffer();

      const smallBuffer = await sharp(req.file.buffer)
        .resize(80, 80)
        .toBuffer();

      const largeBuffer = await sharp(req.file.buffer)
        .resize(200, 200)
        .toBuffer();

      const normalStream = Readable.from(normalBuffer);
      const smallStream = Readable.from(smallBuffer);
      const largeStream = Readable.from(largeBuffer);

      const updatedNormalLink = await upload(normalFilePath, normalStream);
      console.log('updater se pehle', updatedNormalLink);
      updater.photo = updatedNormalLink;

      await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
      const updatedSmallLink = await upload(smallFilePath, smallStream);

      updater.smallPhoto = updatedSmallLink;

      await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
      const updatedLargeLink = await upload(largeFilePath, largeStream);
      updater.largePhoto = updatedLargeLink;
      console.log(' i cam  here', updater);

      req.body = updater;
    }
  }
  next();
});

//audio uploads
exports.trimAudio = catchAsync(async (req, res, next) => {
  if (req.files) {
    const contentAudio = new Array(10).fill('');
    const updatecontentAudio = (position, link) => {
      contentAudio[position] = link;
    };

    for (const [index, el] of req.files.entries()) {
      const mainfilename = getFilename(
        index,
        req.params.postId,
        'post',
        req.user._id.toString(),
        'audio',
        'mp3',
      );

      const filePathPostAudio = `/post/audio/${mainfilename}`;

      const uploadedBuffer = await req.files[index].buffer;
      const originalFileName =
        (await req.files[index].originalname.split('-')[1].split('.')[0]) * 1;
      const finalBuffer = await uploadedBuffer.slice(0, 270000);

      const Stream = Readable.from(finalBuffer);

      const updatedLinkEach = await upload(filePathPostAudio, Stream);

      const doneEach = await updatecontentAudio(
        originalFileName,
        updatedLinkEach,
      );
      await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
    }
    req.body = { contentAudio: contentAudio };
  } else {
    const contentAudio = { contentAudio: '' };
    const updatecontentAudio = async (link) => {
      contentAudio.contentAudio = link;
    };
    const mainfilename = getFilename(
      0,
      req.params.audioId,
      'story',
      req.user._id.toString(),
      'audio',
      'mp3',
    );
    const uploadedBuffer = req.file.buffer;

    const finalBuffer = uploadedBuffer.slice(0, 270000);
    const filePathStoryAudio = `/post/audio/${mainfilename}`;

    const Stream = Readable.from(finalBuffer);

    const updatedLinkEach = await upload(filePathStoryAudio, Stream);

    await updatecontentAudio(updatedLinkEach);
    await new Promise((resolve) => setTimeout(resolve, 1 * 1000));

    req.body = contentAudio;
  }
  next();
});

exports.multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('audio')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! pls upload only image', 400), false);
  }
};
