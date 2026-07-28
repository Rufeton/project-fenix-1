FROM nginxinc/nginx-unprivileged:alpine

COPY index.html styles.css app.js /usr/share/nginx/html/
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080