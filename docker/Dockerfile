FROM node:15.5.0-buster-slim
RUN mkdir /gdb-console
ADD gdb-console.tar /gdb-console
WORKDIR gdb-console
ENTRYPOINT ["npm", "run", "server"]
