@echo off
tcc -Wall ^
 "-I./libs" ^
 "-I./libs/mbedtls/library" ^
 "-I./libs/duktape" ^
 "-L." ^
 "src/loop/core.c" ^
 "libs/http/http_parser.c" ^
 "-run -lduktape -lmbedtls -lws2_32" src/main.c %*
