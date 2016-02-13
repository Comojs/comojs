#include <sys/syscall.h>
#include <sys/types.h>
#include <sys/wait.h>

// Macro custom exported functions for this platform
//===========================================================
#	define COMO_EXPORTED_SYSCALL_FUNCTIONS                  \
	{"kill", como_syscall_kill,                     2},     \
	{"GetLastError", como_get_last_error,           0},
//===========================================================


typedef int32_t *DWORD;
typedef void *(*ptr_sysfunc)();

// dlopen
COMO_METHOD(como_syscall_LoadLibrary) {
	void *handle;
	if (duk_is_null(ctx, 0)){
		handle = dlopen(NULL, RTLD_LAZY);
	} else {
		const char *lib = duk_require_string(ctx, 0);
		handle = dlopen(lib, RTLD_LAZY);
	}

	if (handle == NULL){
		// printf("Loading Module %s Aborted\n", dlerror());
		COMO_SET_ERRNO_AND_RETURN(ctx, EINVAL);
	}

	duk_push_pointer(ctx, handle);
	return 1;
}


COMO_METHOD(como_get_last_error) {
	duk_push_int(ctx, errno);
	return 1;
}


COMO_METHOD(como_syscall_GetProcAddress) {
	void *handle     = duk_require_pointer(ctx, 0);
	const char *proc = duk_require_string(ctx, 1);

	ptr_sysfunc fn = (ptr_sysfunc) dlsym(handle, proc);
	if (fn == NULL){
		// printf("Function Error %s Aborted\n", dlerror());
		COMO_SET_ERRNO_AND_RETURN(ctx, EINVAL);
	}

	duk_push_pointer(ctx, fn);
	return 1;
}


COMO_METHOD(como_syscall_kill) {
	int pid        = duk_require_int(ctx, 0);
	int signum     = duk_get_int(ctx, 1);
	if (kill(pid, signum) == -1){
		COMO_SET_ERRNO_AND_RETURN(ctx, errno);
	}
	duk_push_true(ctx);
	return 1;
}


COMO_METHOD(como_syscall_syscall) {
	ptr_sysfunc fn     = (ptr_sysfunc)duk_require_pointer(ctx, 0);

	size_t len;
	void *ret      = duk_require_buffer_data(ctx, 1, &len);

	memset(ret, '\0', len);

	int top = duk_get_top(ctx);
	void *arg1, *arg2, *arg3, *arg4, *arg5, *arg6, *arg7;

	switch(top-2) {
		case 0 : {
			*(DWORD*)ret = fn(); break;
		}

		case 1 : {
			SYS_ARGS(1);
			*(DWORD*)ret = fn(arg1); break;
		}

		case 2 : {
			SYS_ARGS(1); SYS_ARGS(2);
			*(DWORD*)ret = fn(arg1, arg2); break;
		}

		case 3 : {
			SYS_ARGS(1); SYS_ARGS(2); SYS_ARGS(3);
			*(DWORD*)ret = fn(arg1, arg2, arg3); break;
		}

		case 4 : {
			SYS_ARGS(1); SYS_ARGS(2); SYS_ARGS(3); SYS_ARGS(4);
			*(DWORD*)ret = fn(arg1, arg2, arg3, arg4); break;
		}

		case 5 : {
			SYS_ARGS(1); SYS_ARGS(2); SYS_ARGS(3); SYS_ARGS(4); SYS_ARGS(5);
			*(DWORD*)ret = fn(arg1, arg2, arg3, arg4, arg5); break;
		}

		case 6 : {
			SYS_ARGS(1); SYS_ARGS(2); SYS_ARGS(3); SYS_ARGS(4); SYS_ARGS(5); SYS_ARGS(6);
			*(DWORD*)ret = fn(arg1, arg2, arg3, arg4, arg5, arg6); break;
		}

		case 7 : {
			SYS_ARGS(1); SYS_ARGS(2); SYS_ARGS(3); SYS_ARGS(4); SYS_ARGS(5); SYS_ARGS(6); SYS_ARGS(7);
			*(DWORD*)ret = fn(arg1, arg2, arg3, arg4, arg5, arg6, arg7); break;
		}

		default : assert(0 && "too many arguments passed to syscall");
	}

	return 1;
}
