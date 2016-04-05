#ifndef _COMO_CORE_H
#define _COMO_CORE_H

const int ixEndianTest = 1;
#define como_bigEndian() ( (*(char*)&ixEndianTest) == 0 )
#define como_littleEndian() ( (*(char*)&ixEndianTest) != 0 )

#include <errno.h>
#include <unistd.h>

//use local js files when running with tinycc
#ifdef __TINYC__
#define COMO_LOCAL_JS
#endif

#ifdef _WIN32
	#ifdef __TINYC__
		#include "tinycc/assert.h"
	#else
		#include <assert.h>
	#endif

	#include <winsock2.h>
	#include <windows.h>

	#define dlopen(x,y) (void*)LoadLibrary(x)
	#define dlclose(x) FreeLibrary((HMODULE)x)
	#define COMO_GET_LAST_ERROR GetLastError()

	static inline int _WSLASTERROR (){
		int er = WSAGetLastError();
		if (er == WSAEINVAL){
			return EINVAL;
		}
		return er;
	}

	#define COMO_GET_LAST_WSA_ERROR _WSLASTERROR()
#else
	#include <assert.h>
	#include <dlfcn.h>
	#define COMO_GET_LAST_ERROR errno

	/* win32 socket compatible constants */
	#define SOCKET int
	#define INVALID_SOCKET -1
	#define SOCKET_ERROR -1
	#define COMO_GET_LAST_WSA_ERROR errno
#endif

#include "duktape/duktape.h"



#define ARRAY_SIZE(a) (sizeof(a) / sizeof((a)[0]))

#define COMO_DEFINE_CONSTANT(constant)    \
	{#constant, constant},

#define COMO_METHOD(name) static int (name)(duk_context *ctx)


// MACRO set errno to process.errno
//======================================================
#	define COMO_SET_ERRNO(ctx, err) do {                \
	errno = err;                                        \
	duk_push_global_object(ctx);                        \
	duk_get_prop_string(ctx, -1, "process");            \
	duk_push_string(ctx, "errno");                      \
	duk_push_int(ctx, err);                             \
	duk_put_prop(ctx, -3);                              \
} while(0)


// MACRO set errno to process.errno and return null
//======================================================
#	define COMO_SET_ERRNO_AND_RETURN(ctx, err) do {     \
	COMO_SET_ERRNO(ctx, err);                           \
	duk_push_null(ctx);                                 \
	return 1;                                           \
} while(0)


void como_run (duk_context *ctx);
duk_context *como_create_new_heap (int argc, char *argv[], void *error_handle);

void dump_stack(duk_context *ctx, const char *name) {
	duk_idx_t i, n;
	n = duk_get_top(ctx);
	printf("%s (top=%ld):", name, (long) n);
	for (i = 0; i < n; i++) {
		printf(" (%i)- ", i);
		duk_dup(ctx, i);
		if (duk_get_type(ctx, -1) == DUK_TYPE_BUFFER){
			printf("%s", "BUFFER");
		} else {
			printf("%s", duk_safe_to_string(ctx, -1));
		}
		duk_pop(ctx);
	}
	printf("\n");
	fflush(stdout);
}

/* BINDINGS */
#include "bindings/constants.c"
#include "bindings/C.c"
#include "bindings/buffer.c"
#include "bindings/syscall.c"
#include "bindings/loop.c"
#include "bindings/posix.c"
#include "bindings/socket.c"
#include "bindings/errno.c"
#include "bindings/http-parser.c"

#ifdef _WIN32
	#define PLATFORM "win32"
#elif __APPLE__
	#if TARGET_OS_IPHONE && TARGET_IPHONE_SIMULATOR
		// define something for simulator
	#elif TARGET_OS_IPHONE
		// define something for iphone
	#else
		#define TARGET_OS_OSX 1
		// define something for OSX
	#endif
#elif __linux
	 #define PLATFORM "linux"
#elif __unix // all unices not caught above
	 #define PLATFORM "unix"
#elif __posix
	#define PLATFORM "posix"
#endif

#endif /*_COMO_CORE_H*/
