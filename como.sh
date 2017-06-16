tcc -Wall \
 "-I./src" \
 "-I./modules" \
 "-I./libs" \
 "-I./libs/mbedtls/library" \
 "-I./libs/duktape" \
 "-L." \
 "-L./build" \
 "src/loop/core.c" \
 "libs/thread/tinycthread.c" \
 "libs/http/http_parser.c" \
 "-run -lrt -lduktape -lmbedtls -lpthread" src/main.c $*
