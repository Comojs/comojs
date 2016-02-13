COMO_METHOD(como_types_int8){
	duk_int8_t n = (duk_int8_t)duk_get_int(ctx, 0);
	duk_push_int(ctx, n);
	return 1;
}

COMO_METHOD(como_types_uint8){
	duk_uint8_t n = (duk_uint8_t)duk_get_int(ctx, 0);
	duk_push_uint(ctx, n);
	return 1;
}

COMO_METHOD(como_types_int16){
	duk_int16_t n = (duk_int16_t)duk_get_int(ctx, 0);
	duk_push_int(ctx, n);
	return 1;
}

COMO_METHOD(como_types_uint16){
	duk_uint16_t n = (duk_uint16_t)duk_get_int(ctx, 0);
	duk_push_uint(ctx, n);
	return 1;
}

COMO_METHOD(como_types_int32){
	duk_int32_t n = (duk_int32_t)duk_get_number(ctx, 0);
	duk_push_int(ctx, n);
	return 1;
}

COMO_METHOD(como_types_uint32){
	duk_uint32_t n = (duk_uint32_t)duk_get_number(ctx, 0);
	duk_push_uint(ctx, n);
	return 1;
}

COMO_METHOD(como_types_int64){
	duk_int64_t n = (duk_int64_t)duk_get_number(ctx, 0);
	duk_get_number(ctx, n);
	return 1;
}

COMO_METHOD(como_types_uint64){
	duk_uint64_t n = (duk_uint64_t)duk_get_number(ctx, 0);
	duk_push_number(ctx, n);
	return 1;
}

static const duk_number_list_entry como_types_data[] = {
	{"INT_MAX",          INT_MAX               },

	//basic types
	{"int",             sizeof(int)            },
	{"long",            sizeof(long)           },
	{"ulong",           sizeof(unsigned long)  },

	{"longlong",        sizeof(long long)      },

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
	{"intptr",           sizeof(duk_intptr_t)  },
	{NULL,                                   0 }
};

static const duk_function_list_entry como_types_funcs[] = {
	{"byte", como_types_uint8,                           1},
	{"int8", como_types_int8,                            1},
	{"int16", como_types_int16,                          1},
	{"int32", como_types_int32,                          1},
	{"uint8", como_types_uint8,                          1},
	{"uint16", como_types_uint16,                        1},
	{"uint32", como_types_uint32,                        1},
	{"int64", como_types_int64,                          1},
	{"uint64", como_types_uint64,                        1},
	{NULL, NULL, 0}
};

static int init_binding_types(duk_context *ctx) {
	duk_push_object(ctx);
	duk_put_function_list(ctx, -1, como_types_funcs);

	duk_push_object(ctx);
	duk_put_number_list(ctx, -1, como_types_data);
	duk_put_prop_string(ctx, -2, "data");
	return 1;
}
