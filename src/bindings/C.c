#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#endif

#define COMO_INT 0
#define COMO_UINT8 1
#define COMO_UINT16 2
#define COMO_UINT32 3
#define COMO_POINTER 4
#define COMO_BUFFER 5
#define COMO_INT32 6
#define COMO_INT16 7
#define COMO_INT8 8

duk_ret_t como_struct_buffer_get(duk_context *ctx);
duk_ret_t como_struct_func(duk_context *ctx);

void como_build_struct_member(duk_context *ctx, int type, int offset, int size, const char *name) {
	int fn_idx = duk_push_c_function(ctx, como_struct_func, 1);

	duk_push_string(ctx, "buffer");
	duk_push_c_function(ctx, como_struct_buffer_get, 0 /*nargs*/);
	duk_dup(ctx, 1); /* dup array buffer */
	duk_put_prop_string(ctx, -2, "_buffer");
	duk_def_prop(ctx, fn_idx, DUK_DEFPROP_HAVE_GETTER);

	/* struct member offset */
	duk_push_int(ctx, offset);
	duk_put_prop_string(ctx, -2, "offset");

	/* struct member size */
	duk_push_int(ctx, size);
	duk_put_prop_string(ctx, -2, "size");
	/* struct member type */
	duk_push_int(ctx, type);
	duk_put_prop_string(ctx, -2, "type");

	duk_put_prop_string(ctx, -2, name);
}

#define COMO_STRUCT_MEMBER(_struct, name, type) do { \
	int offset = offsetof(_struct, name); \
	int size = sizeof(str->name); \
	como_build_struct_member(ctx, type, offset, size, #name); \
} while(0)


#define COMO_STRUCT_CREATE_MEMBER(name, idx) do {    \
	duk_push_c_function(ctx, como_struct_func, 1);   \
	/* struct member offset */                       \
	duk_push_int(ctx, offset);                       \
	duk_put_prop_string(ctx, -2, "offset");          \
	/* struct member size */                         \
	duk_push_int(ctx, size);                         \
	duk_put_prop_string(ctx, -2, "size");            \
	/* struct member type */                         \
	duk_push_int(ctx, type);                         \
	duk_put_prop_string(ctx, -2, "type");            \
	/**/                                             \
	duk_put_prop_string(ctx, idx, name);             \
} while(0)



#define COMO_STRUCT_START(_struct)                                            \
	int arg_type = duk_get_type(ctx, 0);                                      \
	_struct *str;                                                             \
	int struct_size = sizeof(_struct);                                        \
	str = duk_push_fixed_buffer(ctx, struct_size);                            \
	duk_push_buffer_object(ctx, -1, 0, struct_size, DUK_BUFOBJ_ARRAYBUFFER);  \
	if (arg_type != DUK_TYPE_UNDEFINED && arg_type != DUK_TYPE_NONE){         \
		if (arg_type == DUK_TYPE_POINTER){                                    \
			void *ptr = duk_require_pointer(ctx, 0);                          \
			memcpy(str, ptr, struct_size);                                    \
		} else {                                                              \
			duk_uint8_t *ptr = duk_require_buffer_data(ctx, 0, NULL);         \
			duk_uintptr_t nr = *((duk_uintptr_t*)&ptr[0]);                    \
			memcpy(str,  (void *)(duk_uintptr_t)nr, struct_size);             \
		}                                                                     \
	}


#define COMO_STRUCT_SIGNED_METHOD(def) do { \
	char *buf = duk_require_buffer_data(ctx, -1, NULL); \
	if (setter){ \
		def num = (def)duk_require_int(ctx, 0); \
		*((def*)&buf[offset]) = num; \
	} else { \
		def nr = *((def*)&buf[offset]); \
		duk_push_int(ctx, nr); \
	} \
	return 1; \
} while(0)


#define COMO_STRUCT_UNSIGNED_METHOD(def) do { \
	char *buf = duk_require_buffer_data(ctx, -1, NULL); \
	if (setter){ \
		def num = (def)duk_require_uint(ctx, 0); \
		*((def*)&buf[offset]) = num; \
	} else { \
		def nr = *((def*)&buf[offset]); \
		duk_push_uint(ctx, nr); \
	} \
	return 1; \
} while(0)

/*=============================================================================
  struct member buffer getter
  this is a getter function for struct filed
  it returns buffer data of the struct field
  struct.field.buffer
 ============================================================================*/
duk_ret_t como_struct_buffer_get(duk_context *ctx){
	duk_push_this(ctx);
	duk_get_prop_string(ctx, -1, "offset");
	int offset = duk_require_int(ctx, -1);
	duk_get_prop_string(ctx, -2, "size");
	int size = duk_require_int(ctx, -1);
	duk_pop_3(ctx);

	duk_push_current_function(ctx);
	duk_get_prop_string(ctx, -1, "_buffer");
	duk_require_buffer_data(ctx, -1, NULL);

	duk_push_buffer_object(ctx, -1, offset, size, DUK_BUFOBJ_ARRAYBUFFER);
	return 1;
}


/*=============================================================================
  struct members
  int8, uint8, int, int32, uint32, int16, uint16
 ============================================================================*/
duk_ret_t como_struct_int(duk_context *ctx, int offset, int size, int setter){
	COMO_STRUCT_SIGNED_METHOD(duk_int_t);
}

duk_ret_t como_struct_uint8(duk_context *ctx, int offset, int size, int setter){
	COMO_STRUCT_UNSIGNED_METHOD(duk_uint8_t);
}

duk_ret_t como_struct_int8(duk_context *ctx, int offset, int size, int setter){
	COMO_STRUCT_SIGNED_METHOD(duk_int8_t);
}

duk_ret_t como_struct_uint16(duk_context *ctx, int offset, int size, int setter){
	COMO_STRUCT_UNSIGNED_METHOD(duk_uint16_t);
}

duk_ret_t como_struct_int16(duk_context *ctx, int offset, int size, int setter){
	COMO_STRUCT_SIGNED_METHOD(duk_int16_t);
}

duk_ret_t como_struct_uint32(duk_context *ctx, int offset, int size, int setter){
	COMO_STRUCT_UNSIGNED_METHOD(duk_uint32_t);
}

duk_ret_t como_struct_int32(duk_context *ctx, int offset, int size, int setter){
	COMO_STRUCT_SIGNED_METHOD(duk_int32_t);
}


/*=============================================================================
  pointer struct member
 ============================================================================*/
duk_ret_t como_struct_pointer(duk_context *ctx, int offset, int size, int setter){
	char *buf = duk_require_buffer_data(ctx, -1, NULL);
	if (setter){
		char *value = duk_require_buffer_data(ctx, 0, NULL);
		void **p1 = (void *)&buf[offset];
		void **p2 = (void *)&value;
		*((duk_uintptr_t *)p1) = *((duk_uintptr_t *)p2);

		duk_push_current_function(ctx);
		duk_push_heapptr(ctx, duk_to_pointer(ctx, 0));
		duk_put_prop_string(ctx, -2, "ptr");
	} else {
		duk_push_current_function(ctx);
		duk_get_prop_string(ctx, -1, "ptr");
		if (duk_is_undefined(ctx, 0)){
			int nr = *((int*)&buf[offset]);
			if (nr == 0){
				duk_push_null(ctx);
			} else {
				duk_push_pointer(ctx, (void *)(intptr_t)nr);
			}
		}
	}
	return 1;
}


duk_ret_t (*fun_ptr_arr[])(duk_context *, int, int, int) = {
	como_struct_int,
	como_struct_uint8,
	como_struct_uint16,
	como_struct_uint32,
	como_struct_pointer,
	NULL,
	como_struct_int32,
	como_struct_int16,
	como_struct_int8
};


duk_ret_t como_struct_func(duk_context *ctx) {

	duk_push_current_function(ctx);

	duk_get_prop_string(ctx, -1, "offset");
	int offset = duk_require_int(ctx, -1);

	duk_get_prop_string(ctx, -2, "size");
	int size = duk_require_int(ctx, -1);

	duk_get_prop_string(ctx, -3, "type");
	int filed_type = duk_require_int(ctx, -1);

	if (duk_is_null(ctx, 0)){
		char *buf = duk_require_buffer_data(ctx, -1, NULL);
		memset(&buf[offset], 0, size);
		return 1;
	}

	// push this object to get buffer data
	duk_push_this(ctx);

	if (duk_is_undefined(ctx, 0)){ // getter
		return (*fun_ptr_arr[filed_type])(ctx, offset, size, 0);
	} else { //setter
		return (*fun_ptr_arr[filed_type])(ctx, offset, size, 1);
	}

	return 1;
}


duk_ret_t como_struct_constructor(duk_context *ctx) {

	duk_push_current_function(ctx);
	duk_get_prop_string(ctx, -1, "__len");
	int length = duk_require_int(ctx, -1);

	duk_eval_string(ctx, "Object.setPrototypeOf");
	duk_push_fixed_buffer(ctx, length);
	duk_push_buffer_object(ctx, -1, 0, length, DUK_BUFOBJ_ARRAYBUFFER);
	duk_push_current_function(ctx);
	duk_call_method(ctx, 2);
	return 1;
}


COMO_METHOD(como_create_struct) {
	int offset = 0;
	int type = 0;
	int size = 0;

	duk_idx_t idx = duk_push_c_function(ctx, como_struct_constructor, 0);

	duk_enum(ctx, 0, DUK_ENUM_OWN_PROPERTIES_ONLY);
	while (duk_next(ctx, -1, 1)){
		const char *name = duk_require_string(ctx, -2);
		type = duk_require_int(ctx, -1);
		duk_pop_2(ctx);

		switch(type){
			case COMO_INT : size = sizeof(int); break;
			case COMO_UINT8 : size = sizeof(duk_uint8_t); break;
			case COMO_UINT16 : size = sizeof(duk_uint16_t); break;
			case COMO_INT16 : size = sizeof(duk_int16_t); break;
			case COMO_UINT32 : size = sizeof(duk_uint32_t); break;
			case COMO_INT32 : size = sizeof(duk_int32_t); break;
			case COMO_POINTER : size = sizeof(void *); break;
			default : assert(0 && "unknown struct type");
		}

		COMO_STRUCT_CREATE_MEMBER(name, idx);
		offset += size;
	}

	int length = offset;

	duk_dup(ctx, idx);
	duk_push_int(ctx, length);
	duk_put_prop_string(ctx, -2, "__len");
	return 1;
}


/*=============================================================================
  convert buffer data to pointer address
 ============================================================================*/
COMO_METHOD(como_c_buffer_to_pointer) {
	duk_uint8_t *ptr = duk_require_buffer_data(ctx, 0, NULL);
	duk_uintptr_t nr = *((duk_uintptr_t*)&ptr[0]);
	duk_push_pointer(ctx, (void *)(duk_uintptr_t)nr);
	return 1;
}


/*=============================================================================
  addrinfo struct <winsock2.h>
 ============================================================================*/
COMO_METHOD(como_struct_addrinfo) {
	COMO_STRUCT_START (struct addrinfo);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_flags, COMO_INT);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_family, COMO_INT);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_socktype, COMO_INT);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_protocol, COMO_INT);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_addrlen, COMO_INT);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_canonname, COMO_POINTER);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_addr, COMO_POINTER);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_next, COMO_POINTER);
	return 1;
}


COMO_METHOD(como_struct_sockaddr) {
	COMO_STRUCT_START(struct sockaddr_in);
	COMO_STRUCT_MEMBER(struct sockaddr_in, sin_family, COMO_INT16);
	COMO_STRUCT_MEMBER(struct sockaddr_in, sin_port, COMO_UINT16);
	COMO_STRUCT_MEMBER(struct sockaddr_in, sin_addr, COMO_UINT32);
	COMO_STRUCT_MEMBER(struct sockaddr_in, sin_zero, COMO_INT);
	return 1;
}


struct como_st_test {
	duk_uint8_t num8;
	duk_uint16_t num16;
	duk_uint32_t num32;
	duk_int32_t numi32;
	duk_int16_t numi16;
	duk_int8_t numi8;
	struct como_st_test *str;
	int num2;
};


COMO_METHOD(como_struct_test) {
	COMO_STRUCT_START(struct como_st_test);
	COMO_STRUCT_MEMBER(struct como_st_test, num8, COMO_UINT8);
	COMO_STRUCT_MEMBER(struct como_st_test, numi8, COMO_INT8);
	COMO_STRUCT_MEMBER(struct como_st_test, num16, COMO_UINT16);
	COMO_STRUCT_MEMBER(struct como_st_test, numi16, COMO_INT16);
	COMO_STRUCT_MEMBER(struct como_st_test, num32, COMO_UINT32);
	COMO_STRUCT_MEMBER(struct como_st_test, numi32, COMO_INT32);
	COMO_STRUCT_MEMBER(struct como_st_test, num2, COMO_INT);
	COMO_STRUCT_MEMBER(struct como_st_test, str, COMO_POINTER);
	return 1;
}


/*=============================================================================
  socket export functions list
 ============================================================================*/
static const duk_function_list_entry como_C_funcs[] = {
	{"addrinfo", como_struct_addrinfo, 1},
	{"sockaddr", como_struct_sockaddr, 1},
	{"create", como_create_struct, 1},
	{"pointer", como_c_buffer_to_pointer, 1},
	{"s_test", como_struct_test, 1},
	{NULL, NULL, 0}
};


static const duk_number_list_entry como_struct_data_types[] = {

	/* struct member types */
	{"INT",              COMO_INT              },
	{"UINT8",            COMO_UINT8            },
	{"UINT16",           COMO_UINT16           },
	{"UINT32",           COMO_UINT32           },
	{"INT8",             COMO_INT8             },
	{"INT16",            COMO_INT16            },
	{"INT32",            COMO_INT32            },
	{"POINER",           COMO_POINTER          },
	{"BUFFER",           COMO_BUFFER           },

	/* c data size */
	{"int",              sizeof(int)           },
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
	{"intptr",           sizeof(duk_intptr_t) },
	{NULL, 0}
};


static int init_binding_C(duk_context *ctx) {
	duk_push_object(ctx);
	duk_put_function_list(ctx, -1, como_C_funcs);
	duk_put_number_list(ctx, -1, como_struct_data_types);
	return 1;
}
