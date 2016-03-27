#include "syscall/syscall.h"
#ifdef _WIN32
	#include "syscall/windows.h"
#else
	#include "syscall/notWindows.h"
#endif

typedef struct {
	int num;
} fncall;


typedef void* (*como_c_function)();
fncall *test_fn_pointer(int nn){
	printf("Called\n");

	fncall *ret = malloc(sizeof(*ret));
	ret->num = nn;
	return ret;
}


COMO_METHOD(como_syscall_ex) {
	como_c_function ptr_to_main = (como_c_function)test_fn_pointer;
	duk_push_pointer(ctx, ptr_to_main);
	return 1;
}


COMO_METHOD(como_syscall_call) {
	como_c_function fn = (como_c_function)duk_get_pointer(ctx, 0);
	void *ret = duk_require_buffer_data(ctx, 1, NULL);
	*(duk_uintptr_t *)ret = *(duk_uintptr_t *)fn(9);
	return 1;
}


typedef struct {
	int32_t test;
} comoSysTestTest;


typedef struct {
	int testNum;
	duk_uint32_t testUINT32;
	comoSysTestTest *p; /* pointer to another struct */
	char buf[8];
	comoSysTestTest p2; /* another struct members */
	duk_int8_t *pnum; /* pointer to number */
} comoSysTest;


COMO_METHOD(como_syscall_test) {
	comoSysTest *st = duk_require_buffer_data(ctx, 0, NULL);
	printf("current value %i\n", st->testNum);
	printf("current string: %s\n", st->buf);

	printf("current test pointer: %p\n", st->p);
	printf("current test test: %i\n", st->p->test);

	// st->testNum = st->testNum + 1;
	st->buf[0] = 'H';
	st->buf[1] = 'i';
	st->buf[2] = ' ';
	st->buf[3] = 'T';
	st->buf[4] = 'h';
	st->buf[5] = 'e';
	st->buf[6] = 'r';
	st->buf[7] = 'e';
	st->p->test = st->testNum + 1;
	st->testNum = INT_MAX;
	st->testUINT32 = (duk_uint32_t)INT_MAX + 1;
	st->p2.test = 99;
	st->pnum = (duk_int8_t *)258;
	return 1;
}


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
	{"syscall", como_syscall_syscall,          DUK_VARARGS},

	// expand syscall functions from platforms
	COMO_EXPORTED_SYSCALL_FUNCTIONS

	{"ex", como_syscall_ex,                              1},
	{"call", como_syscall_call,                          2},
	{"test", como_syscall_test,                          1},

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


static const duk_number_list_entry como_syscall_data_types[] = {
	{"int8",             sizeof(duk_int8_t)    },
	{"uint8",            sizeof(duk_uint8_t)   },

	{"int16",            sizeof(duk_int16_t)   },
	{"uint16",           sizeof(duk_uint16_t)  },

	{"int32",            sizeof(duk_int32_t)   },
	{"uint32",           sizeof(duk_uint32_t)  },

	{"int64",            sizeof(duk_int64_t)   },
	{"uint64",           sizeof(duk_uint64_t)  },

	#ifdef BOOL
	{"BOOL",             sizeof(BOOL)          },
	#endif
	{"NULL",             sizeof(((void*)0))    },
	{"uintptr",          sizeof(duk_uintptr_t) },
	{NULL, 0}
};


static int init_binding_syscall(duk_context *ctx) {
	duk_push_object(ctx);
	duk_put_function_list(ctx, -1, como_syscall_funcs);
	duk_put_number_list(ctx, -1, como_syscall_constants);

	duk_push_object(ctx);
	duk_put_number_list(ctx, -1, como_syscall_data_types);
	duk_put_prop_string(ctx, -2, "dataTypes");
	return 1;
}
