#!/bin/sh
# certbot 续期后的 deploy hook。
#
# 为什么要它：wb.hoarfrost.cloud 用的是 webroot（http-01）方式签发，certbot 不会像
# --nginx 插件那样自动重载 nginx；证书续期后必须 reload 才会被加载，否则到期日一到
# 浏览器就会报证书过期。
#
# 部署位置：/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh（需 chmod +x）
systemctl reload nginx
