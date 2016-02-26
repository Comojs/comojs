#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#endif

// initiate struct object Macro
//=============================================================================
#	define COMO_STRUCT_START(_struct)                                         \
	_struct *str;                                                             \
	duk_push_object(ctx)

// add struct member Macro
//=============================================================================
#	define COMO_STRUCT_MEMBER(_struct, name, type) do {                       \
	int offset = offsetof(_struct, name);                                     \
	int size   = sizeof(str->name);                                           \
	duk_push_object(ctx);                                                     \
	duk_push_int(ctx, offset);                                                \
	duk_put_prop_string(ctx, -2, "offset");                                   \
	duk_push_int(ctx, size);                                                  \
	duk_put_prop_string(ctx, -2, "size");                                     \
	duk_push_string(ctx, type);                                               \
	duk_put_prop_string(ctx, -2, "type");                                     \
	duk_put_prop_string(ctx, -2, #name);                                      \
} while(0)

// signed numbers Macro
//=============================================================================
#	define COMO_C_SIGNED_METHOD(def) do {                                     \
	char *buf  = duk_require_buffer_data(ctx, 0, NULL);                       \
	int offset = duk_require_int(ctx, 1);                                     \
	/* int size   = duk_require_int(ctx, 2); */                               \
	if (duk_is_undefined(ctx, 3)){                                            \
	    def nr = *((def*)&buf[offset]);                                       \
	    duk_push_int(ctx, nr);                                                \
	} else {                                                                  \
	    def num = (def)duk_require_int(ctx, 3);                               \
	    *((def*)&buf[offset]) = num;                                          \
	}                                                                         \
	return 1;                                                                 \
} while(0)

// unsigned numbers Macro
//=============================================================================
#	define COMO_C_USIGNED_METHOD(def) do {                                    \
	char *buf  = duk_require_buffer_data(ctx, 0, NULL);                       \
	int offset = duk_require_int(ctx, 1);                                     \
	/* int size   = duk_require_int(ctx, 2); */                               \
	if (duk_is_undefined(ctx, 3)){                                            \
	    def nr = *((def*)&buf[offset]);                                       \
	    duk_push_uint(ctx, nr);                                               \
	} else {                                                                  \
	    def num = (def)duk_require_uint(ctx, 3);                              \
	    *((def*)&buf[offset]) = num;                                          \
	}                                                                         \
	return 1;                                                                 \
} while(0)
//=============================================================================



/*=============================================================================
  convert buffer data to pointer address
 ============================================================================*/
COMO_METHOD(como_c_pointer) {
	duk_uint8_t *buf = duk_require_buffer_data(ctx, 0, NULL);
	int offset = duk_get_int(ctx, 1);

	//get pointer value stored in buffer at offset
	if (duk_is_undefined(ctx, 3)){
		duk_uintptr_t nr = *((duk_uintptr_t*)&buf[offset]);
		if (nr == 0){
			duk_push_null(ctx);
		}
		else {
			duk_push_pointer(ctx, (void *)(duk_uintptr_t)nr);
		}
	}
	//set pointer value in buffer at offset
	else {
		return 1;
		char *value = duk_require_buffer_data(ctx, 2, NULL);
		void **p1 = (void *)&buf[offset];
		void **p2 = (void *)&value;
		*((duk_uintptr_t *)p1) = *((duk_uintptr_t *)p2);
	}

	return 1;
}


/*=============================================================================
  convert buffer data to pointer address
 ============================================================================*/
COMO_METHOD(como_c_copy_data) {
	size_t bufLen;
	duk_int8_t *buf = duk_require_buffer_data(ctx, 0, &bufLen);
	void *ptr       = duk_require_pointer(ctx, 1);
	memcpy(buf, ptr, bufLen);
	return 1;
}


/*=============================================================================
  struct members
  int8, uint8, int, int32, uint32, int16, uint16
 ============================================================================*/
COMO_METHOD(como_c_int)    { COMO_C_SIGNED_METHOD(duk_int_t);      }
COMO_METHOD(como_c_int8)   { COMO_C_SIGNED_METHOD(duk_int8_t);     }
COMO_METHOD(como_c_int16)  { COMO_C_SIGNED_METHOD(duk_int16_t);    }
COMO_METHOD(como_c_int32)  { COMO_C_SIGNED_METHOD(duk_int32_t);    }

COMO_METHOD(como_c_uint8)  { COMO_C_USIGNED_METHOD(duk_uint8_t);   }
COMO_METHOD(como_c_uint16) { COMO_C_USIGNED_METHOD(duk_uint16_t);  }
COMO_METHOD(como_c_uint32) { COMO_C_USIGNED_METHOD(duk_uint32_t);  }


/*=============================================================================
  addrinfo struct
 ============================================================================*/
COMO_METHOD(como_struct_addrinfo) {
	COMO_STRUCT_START (struct addrinfo);
	COMO_STRUCT_MEMBER(struct addrinfo, ai_flags, "int");
	COMO_STRUCT_MEMBER(struct addrinfo, ai_family, "int");
	COMO_STRUCT_MEMBER(struct addrinfo, ai_socktype, "int");
	COMO_STRUCT_MEMBER(struct addrinfo, ai_protocol, "int");
	COMO_STRUCT_MEMBER(struct addrinfo, ai_addrlen, "int");
	COMO_STRUCT_MEMBER(struct addrinfo, ai_canonname, "pointer");
	COMO_STRUCT_MEMBER(struct addrinfo, ai_addr, "pointer");
	COMO_STRUCT_MEMBER(struct addrinfo, ai_next, "pointer");
	return 1;
}


/*=============================================================================
  sockaddr struct
 ============================================================================*/
COMO_METHOD(como_struct_sockaddr) {
	COMO_STRUCT_START(struct sockaddr_in);
	COMO_STRUCT_MEMBER(struct sockaddr_in, sin_family, "int16");
	COMO_STRUCT_MEMBER(struct sockaddr_in, sin_port, "uint16");
	COMO_STRUCT_MEMBER(struct sockaddr_in, sin_addr, "uint32");
	COMO_STRUCT_MEMBER(struct sockaddr_in, sin_zero, "int");
	return 1;
}


/*=============================================================================
  sockaddr6 struct
 ============================================================================*/
COMO_METHOD(como_struct_sockaddr6) {
	COMO_STRUCT_START(struct sockaddr_in6);
	COMO_STRUCT_MEMBER(struct sockaddr_in6, sin6_family, "int16");
	COMO_STRUCT_MEMBER(struct sockaddr_in6, sin6_port, "uint16");
	COMO_STRUCT_MEMBER(struct sockaddr_in6, sin6_addr, "uint32");
	return 1;
}




/*=============================================================================
  C export functions list
 ============================================================================*/
static const duk_function_list_entry como_C_funcs[] = {
	{"copy_buffer_data", como_c_copy_data,       2},
	{"pointer", como_c_pointer,                  4},
	{"int", como_c_int,                         4},
	{"int8", como_c_int8,                        4},
	{"int16", como_c_int16,                      4},
	{"int32", como_c_int32,                      4},
	{"uint8", como_c_uint8,                      4},
	{"uint16", como_c_uint16,                    4},
	{"uint32", como_c_uint32,                    4},
	{NULL, NULL, 0}
};

/*=============================================================================
   built in C structs
 ============================================================================*/
static const duk_function_list_entry como_C_structs[] = {
	{"addrinfo",  como_struct_addrinfo,          0},
	{"sockaddr",  como_struct_sockaddr,          0},
	{"sockaddr6", como_struct_sockaddr6,         0},
	{NULL, NULL, 0}
};


static const duk_number_list_entry como_C_sizeOf[] = {
	/* c data size */
	{"int",              sizeof(int)           },
	{"short",            sizeof(short)         },
	{"long",             sizeof(long)          },
	{"double",           sizeof(double)        },
	{"int8",             sizeof(duk_int8_t)    },
	{"int16",            sizeof(duk_int16_t)   },
	{"int32",            sizeof(duk_int32_t)   },
	{"int64",            sizeof(duk_int64_t)   },

	#ifdef BOOL
	{"BOOL",             sizeof(BOOL)          },
	#endif
	{"null",             sizeof(((void*)0))    },
	{"uintptr",          sizeof(duk_uintptr_t) },
	{"intptr",           sizeof(duk_intptr_t) },
	{NULL, 0}
};


static int init_binding_C(duk_context *ctx) {
	duk_push_object(ctx);
	duk_put_function_list(ctx, -1, como_C_funcs);

	//sizeOf
	duk_push_object(ctx);
	duk_put_number_list(ctx, -1, como_C_sizeOf);
	duk_put_prop_string(ctx, -2, "sizeOf");

	//structs
	duk_push_object(ctx);
	duk_put_function_list(ctx, -1, como_C_structs);
	duk_put_prop_string(ctx, -2, "Struct");

	return 1;
}
