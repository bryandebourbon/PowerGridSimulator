FROM nginx:1.11.3


COPY pgs /usr/share/nginx/html/
#COPY ./nginx/nginx.conf etc/nginx/

RUN apt-get update \
    && apt-get install -y \
        vim \
        telnet
