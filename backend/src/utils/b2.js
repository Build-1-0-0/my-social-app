export async function getB2Auth(env) {
  const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: {
      Authorization: 'Basic ' + btoa(`${env.B2_KEY_ID}:${env.B2_APPLICATION_KEY}`),
    },
  });
  if (!authResponse.ok) {
    throw new Error('Failed to authorize B2');
  }
  const authData = await authResponse.json();
  return {
    apiUrl: authData.apiUrl,
    authToken: authData.authorizationToken,
    downloadUrl: authData.downloadUrl,
  };
}

export async function uploadToB2(file, mimeType, env, username) {
  try {
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit');
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('Unsupported file type');
    }

    const { apiUrl, authToken } = await getB2Auth(env);
    const uploadResponse = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: { Authorization: authToken },
      body: JSON.stringify({ bucketId: env.B2_BUCKET_ID }),
    });
    if (!uploadResponse.ok) {
      throw new Error('Failed to get upload URL');
    }
    const { uploadUrl, authorizationToken: uploadAuthToken } = await uploadResponse.json();

    const fileBuffer = await file.arrayBuffer();
    const fileExtension = mimeType.split('/')[1] || 'file';
    const fileName = `${username}/${crypto.randomUUID()}.${fileExtension}`;

    const uploadFileResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: uploadAuthToken,
        'Content-Type': mimeType,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'X-Bz-Content-Sha1': 'do_not_verify',
      },
      body: fileBuffer,
    });

    if (!uploadFileResponse.ok) {
      throw new Error('Failed to upload file');
    }

    const fileData = await uploadFileResponse.json();
    return {
      fileId: fileData.fileId,
      url: `${env.B2_DOWNLOAD_URL}/file/${env.B2_BUCKET_NAME}/${fileName}`,
    };
  } catch (error) {
    console.error('B2 upload error:', error);
    throw error;
  }
}
