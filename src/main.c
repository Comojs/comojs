/**
  * file : main.c
  * @author : Mamod Mehyar
**************************************************************************/

#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/stat.h>
#include "main.h"
#include "como.h"

#ifndef COMO_LOCAL_JS
const char *como_native_modules =
#include "./js/como_native_modules.h"
;

const char *como_main_js =
#include "./js/como_main_js.h"
;
#endif

extern char **environ;

#include "print-alert/duk_print_alert.c"

/* ALL Bindings ar directly included from main.h */
static const duk_function_list_entry bindings_funcs[] = {
	{ "constants"   , init_system_constants,   0},
	{ "C"           , init_binding_C,          0},
	{ "syscall"     , init_binding_syscall,    0},
	{ "buffer"      , init_binding_buffer,     0},
	{ "loop"        , init_binding_loop,       0},
	{ "posix"       , init_binding_posix,      0},
	{ "socket"      , init_binding_socket,     0},
	{ "errno"       , init_binding_errno,      0},
	{ "http-parser" , init_binding_httpParser, 0},
	{ NULL          , NULL,                    0}
};

static char *_como_substring(char *string, int position, int length) {
	int c;
	char *pointer = malloc(length+1);
	if (pointer == NULL) {
		fprintf(stderr, "Unable to allocate memory.\n");
		exit(EXIT_FAILURE);
	}

	for (c = 0 ; c < position - 1 ; c++) string++;
	for (c = 0 ; c < length ; c++) {
		*(pointer+c) = *string;
		string++;
	}

	*(pointer+c) = '\0';
	return pointer;
}

/**
  * parse environ
**************************************************************************/
static void _como_parse_environment (duk_context *ctx, duk_idx_t obj_idx){
	int i = 1;
	char *s = *environ;
	duk_idx_t sub_obj_idx = duk_push_object(ctx);

	for (; s; i++) {
		char *ENV_name;
		char *ENV_value;
		int index;
		ENV_value = strchr(s, '=');
		if (ENV_value != NULL) {
			index = (int)(ENV_value - s);
			ENV_name = _como_substring(s, 0, index);

			/* pass equal sign */
			ENV_value++;

			duk_push_string(ctx, ENV_value);
			duk_put_prop_string(ctx, sub_obj_idx, ENV_name);
			free(ENV_name);
		}

		s = *(environ+i);
	}

	duk_put_prop_string(ctx, obj_idx, "env");
}

/**
  * process.isFile(num)
**************************************************************************/
COMO_METHOD(como_process_isFile) {
	const char *filename = duk_get_string(ctx, 0);
	struct stat buffer;
	if (stat (filename, &buffer) == 0) {
		duk_push_true(ctx);
	} else {
		duk_push_false(ctx);
	}
	return 1;
}

/**
  * process.stat(path/filename);
**************************************************************************/
COMO_METHOD(como_process_stat) {
	const char *filename = duk_get_string(ctx, 0);
	struct stat buffer;
	int rc = stat (filename, &buffer);
	if (rc == 0) {
		rc = !!(buffer.st_mode & S_IFDIR);
	}
	duk_push_int(ctx, rc);
	return 1;
}

/**
  * process.readFile(filename);
**************************************************************************/
COMO_METHOD(como_process_readFile) {
	const char *path = duk_get_string(ctx, 0);
	FILE *f = NULL;
	char *buf;
	long sz;  /* ANSI C typing */

	if (!path) {
		goto fail;
	}
	f = fopen(path, "rb");
	if (!f) {
		goto fail;
	}
	if (fseek(f, 0, SEEK_END) < 0) {
		goto fail;
	}
	sz = ftell(f);
	if (sz < 0) {
		goto fail;
	}
	if (fseek(f, 0, SEEK_SET) < 0) {
		goto fail;
	}
	buf = (char *) duk_push_fixed_buffer(ctx, (duk_size_t) sz);
	if ((size_t) fread(buf, 1, (size_t) sz, f) != (size_t) sz) {
		duk_pop(ctx);
		goto fail;
	}
	(void) fclose(f);  /* ignore fclose() error */
	duk_buffer_to_string(ctx, -1);
	return 1;

 	fail:
		if (f) {
			(void) fclose(f);  /* ignore fclose() error */
		}

		duk_error(ctx, DUK_ERR_TYPE_ERROR, "read file error");
		return DUK_RET_ERROR;
}

/**
  * process.sleep(num);
******************************************************************************/
COMO_METHOD(como_process_sleep) {
	int milliseconds = duk_get_int(ctx, 0);
	duk_pop(ctx);
	#ifdef _WIN32
		Sleep(milliseconds);
	#else
		usleep(1000 * milliseconds);
	#endif
	return 1;
}


/**
  * process.cwd();
**************************************************************************/
COMO_METHOD(como_process_cwd) {
	char cwd[1024];
	if (getcwd(cwd, sizeof(cwd)) != NULL) {
		duk_push_string(ctx, cwd);
	} else {
		duk_push_string(ctx, "");
	}
	return 1;
}


/**
  * process.eval(str);
**************************************************************************/
COMO_METHOD(como_process_eval) {
	const char *buf = duk_get_string(ctx, 0);
	const char *filename = duk_get_string(ctx, 1);
	duk_push_string(ctx, filename);
	if (duk_pcompile_string_filename(ctx, 0, buf)){
		printf("FATAL EXCEPTION: %s\n", filename);
		printf("%s\n", duk_safe_to_string(ctx, -1));
		duk_destroy_heap(ctx);
		exit(1);
	}
	duk_call(ctx, 0);
	return 1;
}


/**
  * process.exit(exit_status);
**************************************************************************/
COMO_METHOD(como_process_exit) {
	int exitCode = duk_get_int(ctx, 0);
	duk_destroy_heap(ctx);
	exit(exitCode);
	return 1; //not reachable, silence warning
}


/**
  * process.dlOpen(shared_library);
**************************************************************************/
COMO_METHOD(como_process_dlOpen) {
	const char *ModuleName = duk_get_string(ctx, 1);

	void * handle = dlopen(ModuleName, RTLD_LAZY);
	if (!handle){
		printf("Loading Module %s Aborted\n", ModuleName);
		COMO_SET_ERRNO_AND_RETURN(ctx, EINVAL);
	}

	typedef void (*init_t)(duk_context *ctx, const char *ModuleName);
	init_t func = (init_t) dlsym(handle, "_como_init_module");

	if (!func){
		printf("xxx Loading Module %s Aborted\n", ModuleName);
		COMO_SET_ERRNO_AND_RETURN(ctx, EINVAL);
	}

	//register require for this module in global stash
	duk_push_global_stash(ctx);
	duk_get_prop_string(ctx, -1, "modules");
	duk_push_string(ctx, ModuleName);
	duk_dup(ctx, 1);
	duk_put_prop(ctx, -3);

	//init module
	func(ctx, ModuleName);
	return 1;
}


/**
  * process exported functions list
**************************************************************************/
const duk_function_list_entry process_funcs[] = {
	{"isFile", como_process_isFile,        1},
	{"stat", como_process_stat,            1},
	{"readFile", como_process_readFile,    1},
	{"cwd", como_process_cwd,              0},
	{"eval", como_process_eval,            2},
	{"dlopen", como_process_dlOpen,        2},
	{"reallyExit", como_process_exit,      1},
	{"sleep", como_process_sleep,          1},
	{NULL, NULL,                           0}
};


void como_init_process(int argc, char *argv[], duk_context *ctx) {
	duk_push_global_object(ctx);
	duk_push_object(ctx);
	duk_put_function_list(ctx, -1, process_funcs);

	/* process ENV */
	_como_parse_environment(ctx, -2);

	/* process id*/
	duk_push_int(ctx, getpid());
	duk_put_prop_string(ctx, -2, "pid");

	/* process platform*/
	duk_push_string(ctx, DUK_USE_OS_STRING);
	duk_put_prop_string(ctx, -2, "platform");

	duk_push_string(ctx, DUK_USE_ARCH_STRING);
	duk_put_prop_string(ctx, -2, "arch");

	#ifndef COMO_LOCAL_JS
		duk_push_string(ctx, como_native_modules);
		duk_json_decode(ctx, -1);
		duk_put_prop_string(ctx, -2, "NativeSource");
	#endif

	/* threads support */
	#ifdef COMO_NO_THREADS
		duk_push_false(ctx);
	#else
		duk_push_true(ctx);
	#endif
	duk_put_prop_string(ctx, -2, "threads");

	/* tls support */
	#ifdef COMO_NO_TLS
		duk_push_false(ctx);
	#else
		duk_push_true(ctx);
	#endif
	duk_put_prop_string(ctx, -2, "tls");

	/* argv */
	duk_idx_t arr_idx = duk_push_array(ctx);
	int i = 0;
	for (i = 0; i < argc; i++){
		duk_push_string(ctx, argv[i]);
		duk_put_prop_index(ctx, arr_idx, i);
	}
	duk_put_prop_string(ctx, -2, "argv");

	/* bindings */
	duk_push_object(ctx);
	duk_put_function_list(ctx, -1, bindings_funcs);
	duk_put_prop_string(ctx, -2, "bindings");

	duk_put_prop_string(ctx, -2, "process");
	duk_pop(ctx);

	/* Initialize global stash 'modules'. */
	duk_push_global_stash(ctx);
	duk_push_object(ctx);
	duk_put_prop_string(ctx, -2, "modules");
	duk_pop(ctx);
}


duk_context *como_create_new_heap (int argc, char *argv[], void *error_handle) {
	duk_context *ctx = duk_create_heap(NULL, NULL, NULL, NULL, error_handle);
	duk_print_alert_init(ctx, 0);
	como_init_process(argc, argv, ctx);
	return ctx;
}

duk_int_t duk_peval_file(duk_context *ctx, const char *path) {
	duk_int_t rc;

	duk_push_string(ctx, path);
	como_process_readFile(ctx);
	duk_push_string(ctx, path);
	rc = duk_pcompile(ctx, DUK_COMPILE_EVAL);
	if (rc != 0) {
		return rc;
	}
	duk_push_global_object(ctx);  /* 'this' binding */
	rc = duk_pcall_method(ctx, 0);
	return rc;
}

void como_run (duk_context *ctx){
	#ifdef COMO_LOCAL_JS
		if (duk_peval_file(ctx, "js/main.js") != 0) {
			printf("%s\n", duk_safe_to_string(ctx, -1));
			duk_destroy_heap(ctx);
			exit(1);
		}
	#else
		duk_push_string(ctx, como_main_js);
		duk_json_decode(ctx, -1);
		if (duk_peval(ctx) != 0) {
			printf("%s\n", duk_safe_to_string(ctx, -1));
			duk_destroy_heap(ctx);
			exit(1);
		}
	#endif
}


#ifndef COMO_SHARED
int main(int argc, char *argv[], char** envp) {
	(void) argc; (void) argv;

	duk_context *ctx = como_create_new_heap(argc, argv, NULL);

	como_run(ctx);
	duk_pop(ctx);  /* pop eval result */

	//force object finalizers
	duk_gc(ctx, 0);

	duk_destroy_heap(ctx);
	return 0;
}
#endif
