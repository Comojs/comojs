#include <fcntl.h>

// Macro custom exported functions for this platform
//===========================================================
#	define COMO_EXPORTED_SYSCALL_FUNCTIONS                  \
	{"GetFdHandle", como_get_fd_handle,             1},     \
	{"GetHandleFd",  como_get_handle_fd,            1},
//===========================================================


// Macro custom exported constants for this platform
//===========================================================
#	define COMO_EXPORTED_SYSCALL_CONSTANTS
//===========================================================

COMO_METHOD(como_syscall_LoadLibrary) {
	const char *lib = duk_require_string(ctx, 0);
	HINSTANCE hinst;
	hinst = LoadLibrary((LPCTSTR)lib);

	if (hinst == NULL){
		COMO_SET_ERRNO_AND_RETURN(ctx, GetLastError());
	}

	duk_push_pointer(ctx, hinst);
	return 1;
}


COMO_METHOD(como_syscall_GetProcAddress) {
	HINSTANCE hinst    = duk_require_pointer(ctx, 0);
	const char *module = duk_require_string(ctx, 1);
	FARPROC _link;
	_link = GetProcAddress(hinst, (LPCSTR)module);
	if (_link == NULL){
		COMO_SET_ERRNO_AND_RETURN(ctx, GetLastError());
	}
	duk_push_pointer(ctx, _link);
	return 1;
}


COMO_METHOD(como_syscall_syscall) {
	FARPROC fn     = (FARPROC)duk_require_pointer(ctx, 0);
	size_t len;
	void *ret      = duk_require_buffer_data(ctx, 1, &len);
	memset(ret, '\0', len);

	int top = duk_get_top(ctx);
	void *arg1, *arg2, *arg3, *arg4, *arg5, *arg6, *arg7, *arg8, *arg9, *arg10;

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

		case 8 : {
			SYS_ARGS(1); SYS_ARGS(2); SYS_ARGS(3); SYS_ARGS(4); SYS_ARGS(5); SYS_ARGS(6); SYS_ARGS(7); SYS_ARGS(8);
			*(DWORD*)ret = fn(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8); break;
		}

		case 9 : {
			SYS_ARGS(1); SYS_ARGS(2); SYS_ARGS(3); SYS_ARGS(4); SYS_ARGS(5); SYS_ARGS(6); SYS_ARGS(7); SYS_ARGS(8); SYS_ARGS(9);
			*(DWORD*)ret = fn(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9); break;
		}

		case 10 : {
			SYS_ARGS(1); SYS_ARGS(2); SYS_ARGS(3); SYS_ARGS(4); SYS_ARGS(5); SYS_ARGS(6); SYS_ARGS(7); SYS_ARGS(8); SYS_ARGS(9); SYS_ARGS(10);
			*(DWORD*)ret = fn(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10); break;
		}

		default : assert(0 && "too many arguments passed to syscall");
	}

	//syscall released
	return 1;
}


COMO_METHOD(como_get_fd_handle) {
	int fd  = duk_require_int(ctx, 0);
	int handle = _get_osfhandle(fd);
	if (handle == -1){
		COMO_SET_ERRNO_AND_RETURN(ctx, COMO_GET_LAST_ERROR);
	}
	duk_push_int(ctx, handle);
	return 1;
}


COMO_METHOD(como_get_handle_fd) {
	HANDLE handle  = (HANDLE)duk_require_int(ctx, 0);
	int fd = _open_osfhandle((intptr_t)handle, O_RDONLY);
	if (fd == -1){
		COMO_SET_ERRNO_AND_RETURN(ctx, COMO_GET_LAST_ERROR);
	}
	duk_push_int(ctx, fd);
	return 1;
}
