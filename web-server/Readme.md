# Introduction

A simple web server example using Deno web framework.

In order to run this :

```
deno run --allow-net  --allow-read --inspect index.ts
deno run  --allow-read  --allow-run  watcher.ts
pm2 start index.ts --interpreter="deno" --interpreter-args="run --allow-net" 
```