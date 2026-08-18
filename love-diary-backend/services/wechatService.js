const WECHAT_API = 'https://api.weixin.qq.com/sns';

const assertWechatConfig = () => {
  if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
    throw new Error('微信登录尚未配置 AppID/AppSecret');
  }
};

const requestWechat = async (path, params) => {
  const url = new URL(`${WECHAT_API}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    throw new Error(`微信接口请求失败（${response.status}）`);
  }

  const data = await response.json();
  if (data.errcode) {
    throw new Error(`微信授权失败：${data.errmsg || data.errcode}`);
  }
  return data;
};

const exchangeCodeForUser = async (code) => {
  assertWechatConfig();

  const tokenData = await requestWechat('oauth2/access_token', {
    appid: process.env.WECHAT_APP_ID,
    secret: process.env.WECHAT_APP_SECRET,
    code,
    grant_type: 'authorization_code'
  });

  const profile = await requestWechat('userinfo', {
    access_token: tokenData.access_token,
    openid: tokenData.openid,
    lang: 'zh_CN'
  });

  return {
    openid: tokenData.openid,
    unionid: tokenData.unionid || profile.unionid || null,
    nickname: profile.nickname || '微信用户',
    avatar: profile.headimgurl || ''
  };
};

module.exports = { exchangeCodeForUser };

