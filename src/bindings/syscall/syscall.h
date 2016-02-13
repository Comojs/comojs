#ifndef _COMO_SYSCALL
#define _COMO_SYSCALL

#define SYS_ARGS(ix) do {                                             \
    int argnum = ix + 1;                                              \
    int type = duk_get_type(ctx, argnum);                             \
    if (type == DUK_TYPE_STRING){                                     \
        arg##ix = (char *)duk_get_string(ctx, argnum);                \
    } else if (type == DUK_TYPE_NUMBER){                              \
        arg##ix = (void *)(duk_uintptr_t)duk_get_number(ctx, argnum); \
    } else if (type == DUK_TYPE_NULL) {                               \
        arg##ix = NULL;                                               \
    }  else {                                                         \
        arg##ix = duk_require_buffer_data(ctx, argnum, NULL);         \
    }                                                                 \
} while(0)

#endif
