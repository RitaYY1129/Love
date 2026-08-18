const sendWithTencentCloud = async (phone, code, expiresInMinutes) => {
  const tencentcloud = require('tencentcloud-sdk-nodejs-sms');
  const SmsClient = tencentcloud.sms.v20210111.Client;

  const required = [
    'TENCENT_SMS_SECRET_ID',
    'TENCENT_SMS_SECRET_KEY',
    'TENCENT_SMS_SDK_APP_ID',
    'TENCENT_SMS_SIGN_NAME',
    'TENCENT_SMS_TEMPLATE_ID'
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`短信服务缺少配置：${missing.join(', ')}`);
  }

  const client = new SmsClient({
    credential: {
      secretId: process.env.TENCENT_SMS_SECRET_ID,
      secretKey: process.env.TENCENT_SMS_SECRET_KEY
    },
    region: process.env.TENCENT_SMS_REGION || 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'sms.tencentcloudapi.com'
      }
    }
  });

  const response = await client.SendSms({
    SmsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID,
    SignName: process.env.TENCENT_SMS_SIGN_NAME,
    TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
    TemplateParamSet: [code, String(expiresInMinutes)],
    PhoneNumberSet: [`+86${phone}`]
  });

  const status = response.SendStatusSet?.[0];
  if (!status || status.Code !== 'Ok') {
    throw new Error(status?.Message || '短信发送失败');
  }
};

const sendSmsCode = async (phone, code, expiresInMinutes) => {
  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider === 'tencent') {
    await sendWithTencentCloud(phone, code, expiresInMinutes);
    return { provider };
  }

  if (provider === 'console' && process.env.NODE_ENV !== 'production') {
    console.log(`[DEV SMS] ${phone}: ${code}`);
    return { provider, devCode: code };
  }

  throw new Error('生产环境必须配置真实短信服务');
};

module.exports = { sendSmsCode };

