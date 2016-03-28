#include "syscall/syscall.h"
#ifdef _WIN32
	#include "syscall/windows.h"
#else
	#include "syscall/notWindows.h"
#endif


COMO_METHOD(como_syscall_pointerToBuffer){
	char *buf  = duk_require_buffer_data(ctx, 0, NULL);
	char *st   = duk_require_buffer_data(ctx, 1, NULL);
	int offset = duk_require_int(ctx, 2);

	/* save structure address at buffer offset buf[offset] = struct address; */
	void **p1 = (void *)&buf[offset];
	void **p2 = (void *)&st;
	*((duk_uintptr_t *)p1) = *((duk_uintptr_t *)p2);
	return 1;
}


static const duk_function_list_entry como_syscall_funcs[] = {

	{"LoadLibrary", como_syscall_LoadLibrary,            1},
	{"GetProcAddress", como_syscall_GetProcAddress,      2},
	{"pointerToBuffer", como_syscall_pointerToBuffer,    4},

	// como_syscall_syscall defined in syscall/[platform].h
	{"syscall", como_syscall_syscall,          DUK_VARARGS},

	// expand syscall functions from platforms
	COMO_EXPORTED_SYSCALL_FUNCTIONS

	{NULL, NULL, 0}
};


static const duk_number_list_entry como_syscall_constants[] = {
	#ifdef F_GETFD
		COMO_DEFINE_CONSTANT(F_GETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_DUPFD
		COMO_DEFINE_CONSTANT(F_DUPFD)
	#endif

	#ifdef FD_CLOEXEC
		COMO_DEFINE_CONSTANT(FD_CLOEXEC)
	#endif

	#ifdef O_CLOEXEC
		COMO_DEFINE_CONSTANT(O_CLOEXEC)
	#endif

	#ifdef O_DIRECT
		COMO_DEFINE_CONSTANT(O_DIRECT)
	#endif

	#ifdef O_NONBLOCK
		COMO_DEFINE_CONSTANT(O_NONBLOCK)
	#endif

	#ifdef O_RDONLY
		COMO_DEFINE_CONSTANT(O_RDONLY)
	#endif

	#ifdef O_RDWR
		COMO_DEFINE_CONSTANT(O_RDWR)
	#endif

	#ifdef WNOHANG
		COMO_DEFINE_CONSTANT(WNOHANG)
	#endif

	#ifdef WUNTRACED
		COMO_DEFINE_CONSTANT(WUNTRACED)
	#endif

	#ifdef WCONTINUED
		COMO_DEFINE_CONSTANT(WCONTINUED)
	#endif

	#ifdef WEXITED
		COMO_DEFINE_CONSTANT(WEXITED)
	#endif

	#ifdef WSTOPPED
		COMO_DEFINE_CONSTANT(WSTOPPED)
	#endif

	#ifdef F_SETFDxx
		COMO_DEFINE_CONSTANT(F_SETFDxx)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	#ifdef F_SETFD
		COMO_DEFINE_CONSTANT(F_SETFD)
	#endif

	{NULL, 0}
};


static int init_binding_syscall(duk_context *ctx) {
	duk_push_object(ctx);
	duk_put_function_list(ctx, -1, como_syscall_funcs);
	duk_put_number_list(ctx, -1, como_syscall_constants);
	return 1;
}
