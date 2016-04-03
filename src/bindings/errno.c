#include "como_errno.h"

int como_translate_sys_error(int sys_errno) {
    #ifdef _WIN32
        switch (sys_errno) {
            case ERROR_NOACCESS:                    return EACCES;
            case WSAEACCES:                         return EACCES;
            case ERROR_ADDRESS_ALREADY_ASSOCIATED:  return EADDRINUSE;
            case WSAEADDRINUSE:                     return EADDRINUSE;
            case WSAEADDRNOTAVAIL:                  return EADDRNOTAVAIL;
            case WSAEAFNOSUPPORT:                   return EAFNOSUPPORT;
            case WSAEWOULDBLOCK:                    return EAGAIN;
            case WSAEALREADY:                       return EALREADY;
            case ERROR_INVALID_FLAGS:               return EBADF;
            case ERROR_INVALID_HANDLE:              return EBADF;
            case ERROR_LOCK_VIOLATION:              return EBUSY;
            case ERROR_PIPE_BUSY:                   return EBUSY;
            case ERROR_SHARING_VIOLATION:           return EBUSY;
            case ERROR_OPERATION_ABORTED:           return ECANCELED;
            case WSAEINTR:                          return ECANCELED;
            case ERROR_NO_UNICODE_TRANSLATION:      return ECHARSET;
            case ERROR_CONNECTION_ABORTED:          return ECONNABORTED;
            case WSAECONNABORTED:                   return ECONNABORTED;
            case ERROR_CONNECTION_REFUSED:          return ECONNREFUSED;
            case WSAECONNREFUSED:                   return ECONNREFUSED;
            case ERROR_NETNAME_DELETED:             return ECONNRESET;
            case WSAECONNRESET:                     return ECONNRESET;
            case ERROR_ALREADY_EXISTS:              return EEXIST;
            case ERROR_FILE_EXISTS:                 return EEXIST;
            case ERROR_BUFFER_OVERFLOW:             return EFAULT;
            case WSAEFAULT:                         return EFAULT;
            case ERROR_HOST_UNREACHABLE:            return EHOSTUNREACH;
            case WSAEHOSTUNREACH:                   return EHOSTUNREACH;
            case ERROR_INSUFFICIENT_BUFFER:         return EINVAL;
            case ERROR_INVALID_DATA:                return EINVAL;
            case ERROR_INVALID_PARAMETER:           return EINVAL;
            case ERROR_SYMLINK_NOT_SUPPORTED:       return EINVAL;
            case WSAEINVAL:                         return EINVAL;
            case WSAEPFNOSUPPORT:                   return EINVAL;
            case WSAESOCKTNOSUPPORT:                return EINVAL;
            case ERROR_BEGINNING_OF_MEDIA:          return EIO;
            case ERROR_BUS_RESET:                   return EIO;
            case ERROR_CRC:                         return EIO;
            case ERROR_DEVICE_DOOR_OPEN:            return EIO;
            case ERROR_DEVICE_REQUIRES_CLEANING:    return EIO;
            case ERROR_DISK_CORRUPT:                return EIO;
            case ERROR_EOM_OVERFLOW:                return EIO;
            case ERROR_FILEMARK_DETECTED:           return EIO;
            case ERROR_GEN_FAILURE:                 return EIO;
            case ERROR_INVALID_BLOCK_LENGTH:        return EIO;
            case ERROR_IO_DEVICE:                   return EIO;
            case ERROR_NO_DATA_DETECTED:            return EIO;
            case ERROR_NO_SIGNAL_SENT:              return EIO;
            case ERROR_OPEN_FAILED:                 return EIO;
            case ERROR_SETMARK_DETECTED:            return EIO;
            case ERROR_SIGNAL_REFUSED:              return EIO;
            case WSAEISCONN:                        return EISCONN;
            case ERROR_CANT_RESOLVE_FILENAME:       return ELOOP;
            case ERROR_TOO_MANY_OPEN_FILES:         return EMFILE;
            case WSAEMFILE:                         return EMFILE;
            case WSAEMSGSIZE:                       return EMSGSIZE;
            case ERROR_FILENAME_EXCED_RANGE:        return ENAMETOOLONG;
            case ERROR_NETWORK_UNREACHABLE:         return ENETUNREACH;
            case WSAENETUNREACH:                    return ENETUNREACH;
            case WSAENOBUFS:                        return ENOBUFS;
            case ERROR_DIRECTORY:                   return ENOENT;
            case ERROR_FILE_NOT_FOUND:              return ENOENT;
            case ERROR_INVALID_NAME:                return ENOENT;
            case ERROR_INVALID_DRIVE:               return ENOENT;
            case ERROR_INVALID_REPARSE_DATA:        return ENOENT;
            case ERROR_MOD_NOT_FOUND:               return ENOENT;
            case ERROR_PATH_NOT_FOUND:              return ENOENT;
            case WSAHOST_NOT_FOUND:                 return ENOENT;
            case WSANO_DATA:                        return ENOENT;
            case ERROR_NOT_ENOUGH_MEMORY:           return ENOMEM;
            case ERROR_OUTOFMEMORY:                 return ENOMEM;
            case ERROR_CANNOT_MAKE:                 return ENOSPC;
            case ERROR_DISK_FULL:                   return ENOSPC;
            case ERROR_EA_TABLE_FULL:               return ENOSPC;
            case ERROR_END_OF_MEDIA:                return ENOSPC;
            case ERROR_HANDLE_DISK_FULL:            return ENOSPC;
            case ERROR_NOT_CONNECTED:               return ENOTCONN;
            case WSAENOTCONN:                       return ENOTCONN;
            case ERROR_DIR_NOT_EMPTY:               return ENOTEMPTY;
            case WSAENOTSOCK:                       return ENOTSOCK;
            case ERROR_NOT_SUPPORTED:               return ENOTSUP;
            case ERROR_BROKEN_PIPE:                 return EOF;
            case ERROR_ACCESS_DENIED:               return EPERM;
            case ERROR_PRIVILEGE_NOT_HELD:          return EPERM;
            case ERROR_BAD_PIPE:                    return EPIPE;
            case ERROR_NO_DATA:                     return EPIPE;
            case ERROR_PIPE_NOT_CONNECTED:          return EPIPE;
            case WSAESHUTDOWN:                      return EPIPE;
            case WSAEPROTONOSUPPORT:                return EPROTONOSUPPORT;
            case ERROR_WRITE_PROTECT:               return EROFS;
            case ERROR_SEM_TIMEOUT:                 return ETIMEDOUT;
            case WSAETIMEDOUT:                      return ETIMEDOUT;
            case ERROR_NOT_SAME_DEVICE:             return EXDEV;
            case ERROR_INVALID_FUNCTION:            return EISDIR;
            case ERROR_META_EXPANSION_TOO_LONG:     return E2BIG;
            default:                                return UNKNOWN;
        }
    #else
        return sys_errno;
    #endif
}

static const duk_number_list_entry como_errno_errors[] = {
    #ifdef E2BIG
        COMO_DEFINE_CONSTANT(E2BIG)
    #endif

    #ifdef EACCES
        COMO_DEFINE_CONSTANT(EACCES)
    #endif

    #ifdef EADDRINUSE
        COMO_DEFINE_CONSTANT(EADDRINUSE)
    #endif

    #ifdef EADDRNOTAVAIL
        COMO_DEFINE_CONSTANT(EADDRNOTAVAIL)
    #endif

    #ifdef EAFNOSUPPORT
        COMO_DEFINE_CONSTANT(EAFNOSUPPORT)
    #endif

    #ifdef EAGAIN
        COMO_DEFINE_CONSTANT(EAGAIN)
    #endif

    #ifdef EALREADY
        COMO_DEFINE_CONSTANT(EALREADY)
    #endif

    #ifdef EBADF
        COMO_DEFINE_CONSTANT(EBADF)
    #endif

    #ifdef EBADMSG
        COMO_DEFINE_CONSTANT(EBADMSG)
    #endif

    #ifdef EBUSY
        COMO_DEFINE_CONSTANT(EBUSY)
    #endif

    #ifdef ECANCELED
        COMO_DEFINE_CONSTANT(ECANCELED)
    #endif

    #ifdef ECHILD
        COMO_DEFINE_CONSTANT(ECHILD)
    #endif

    #ifdef ECONNABORTED
        COMO_DEFINE_CONSTANT(ECONNABORTED)
    #endif

    #ifdef ECONNREFUSED
        COMO_DEFINE_CONSTANT(ECONNREFUSED)
    #endif

    #ifdef ECONNRESET
        COMO_DEFINE_CONSTANT(ECONNRESET)
    #endif

    #ifdef EDEADLK
        COMO_DEFINE_CONSTANT(EDEADLK)
    #endif

    #ifdef EDESTADDRREQ
        COMO_DEFINE_CONSTANT(EDESTADDRREQ)
    #endif

    #ifdef EDOM
        COMO_DEFINE_CONSTANT(EDOM)
    #endif

    #ifdef EDQUOT
        COMO_DEFINE_CONSTANT(EDQUOT)
    #endif

    #ifdef EEXIST
        COMO_DEFINE_CONSTANT(EEXIST)
    #endif

    #ifdef EFAULT
        COMO_DEFINE_CONSTANT(EFAULT)
    #endif

    #ifdef EFBIG
        COMO_DEFINE_CONSTANT(EFBIG)
    #endif

    #ifdef EHOSTUNREACH
        COMO_DEFINE_CONSTANT(EHOSTUNREACH)
    #endif

    #ifdef EIDRM
        COMO_DEFINE_CONSTANT(EIDRM)
    #endif

    #ifdef EILSEQ
        COMO_DEFINE_CONSTANT(EILSEQ)
    #endif

    #ifdef EINPROGRESS
        COMO_DEFINE_CONSTANT(EINPROGRESS)
    #endif

    #ifdef EINTR
        COMO_DEFINE_CONSTANT(EINTR)
    #endif

    #ifdef EINVAL
        COMO_DEFINE_CONSTANT(EINVAL)
    #endif

    #ifdef EIO
        COMO_DEFINE_CONSTANT(EIO)
    #endif

    #ifdef EISCONN
        COMO_DEFINE_CONSTANT(EISCONN)
    #endif

    #ifdef EISDIR
        COMO_DEFINE_CONSTANT(EISDIR)
    #endif

    #ifdef ELOOP
        COMO_DEFINE_CONSTANT(ELOOP)
    #endif

    #ifdef EMFILE
        COMO_DEFINE_CONSTANT(EMFILE)
    #endif

    #ifdef EMLINK
        COMO_DEFINE_CONSTANT(EMLINK)
    #endif

    #ifdef EMSGSIZE
        COMO_DEFINE_CONSTANT(EMSGSIZE)
    #endif

    #ifdef EMULTIHOP
        COMO_DEFINE_CONSTANT(EMULTIHOP)
    #endif

    #ifdef ENAMETOOLONG
        COMO_DEFINE_CONSTANT(ENAMETOOLONG)
    #endif

    #ifdef ENETDOWN
        COMO_DEFINE_CONSTANT(ENETDOWN)
    #endif

    #ifdef ENETRESET
        COMO_DEFINE_CONSTANT(ENETRESET)
    #endif

    #ifdef ENETUNREACH
        COMO_DEFINE_CONSTANT(ENETUNREACH)
    #endif

    #ifdef ENFILE
        COMO_DEFINE_CONSTANT(ENFILE)
    #endif

    #ifdef ENOBUFS
        COMO_DEFINE_CONSTANT(ENOBUFS)
    #endif

    #ifdef ENODATA
        COMO_DEFINE_CONSTANT(ENODATA)
    #endif

    #ifdef ENODEV
        COMO_DEFINE_CONSTANT(ENODEV)
    #endif

    #ifdef ENOENT
        COMO_DEFINE_CONSTANT(ENOENT)
    #endif

    #ifdef ENOEXEC
        COMO_DEFINE_CONSTANT(ENOEXEC)
    #endif

    #ifdef ENOLCK
        COMO_DEFINE_CONSTANT(ENOLCK)
    #endif

    #ifdef ENOLINK
        COMO_DEFINE_CONSTANT(ENOLINK)
    #endif

    #ifdef ENOMEM
        COMO_DEFINE_CONSTANT(ENOMEM)
    #endif

    #ifdef ENOMSG
        COMO_DEFINE_CONSTANT(ENOMSG)
    #endif

    #ifdef ENOPROTOOPT
        COMO_DEFINE_CONSTANT(ENOPROTOOPT)
    #endif

    #ifdef ENOSPC
        COMO_DEFINE_CONSTANT(ENOSPC)
    #endif

    #ifdef ENOSR
        COMO_DEFINE_CONSTANT(ENOSR)
    #endif

    #ifdef ENOSTR
        COMO_DEFINE_CONSTANT(ENOSTR)
    #endif

    #ifdef ENOSYS
        COMO_DEFINE_CONSTANT(ENOSYS)
    #endif

    #ifdef ENOTCONN
        COMO_DEFINE_CONSTANT(ENOTCONN)
    #endif

    #ifdef ENOTDIR
        COMO_DEFINE_CONSTANT(ENOTDIR)
    #endif

    #ifdef ENOTEMPTY
        COMO_DEFINE_CONSTANT(ENOTEMPTY)
    #endif

    #ifdef ENOTSOCK
        COMO_DEFINE_CONSTANT(ENOTSOCK)
    #endif

    #ifdef ENOTSUP
        COMO_DEFINE_CONSTANT(ENOTSUP)
    #endif

    #ifdef ENOTTY
        COMO_DEFINE_CONSTANT(ENOTTY)
    #endif

    #ifdef ENXIO
        COMO_DEFINE_CONSTANT(ENXIO)
    #endif

    #ifdef EOPNOTSUPP
        COMO_DEFINE_CONSTANT(EOPNOTSUPP)
    #endif

    #ifdef EOVERFLOW
        COMO_DEFINE_CONSTANT(EOVERFLOW)
    #endif

    #ifdef EPERM
        COMO_DEFINE_CONSTANT(EPERM)
    #endif

    #ifdef EPIPE
        COMO_DEFINE_CONSTANT(EPIPE)
    #endif

    #ifdef EPROTO
        COMO_DEFINE_CONSTANT(EPROTO)
    #endif

    #ifdef EPROTONOSUPPORT
        COMO_DEFINE_CONSTANT(EPROTONOSUPPORT)
    #endif

    #ifdef EPROTOTYPE
        COMO_DEFINE_CONSTANT(EPROTOTYPE)
    #endif

    #ifdef ERANGE
        COMO_DEFINE_CONSTANT(ERANGE)
    #endif

    #ifdef EROFS
        COMO_DEFINE_CONSTANT(EROFS)
    #endif

    #ifdef ESPIPE
        COMO_DEFINE_CONSTANT(ESPIPE)
    #endif

    #ifdef ESRCH
        COMO_DEFINE_CONSTANT(ESRCH)
    #endif

    #ifdef ESTALE
        COMO_DEFINE_CONSTANT(ESTALE)
    #endif

    #ifdef ETIME
        COMO_DEFINE_CONSTANT(ETIME)
    #endif

    #ifdef ETIMEDOUT
        COMO_DEFINE_CONSTANT(ETIMEDOUT)
    #endif

    #ifdef ETXTBSY
        COMO_DEFINE_CONSTANT(ETXTBSY)
    #endif

    #ifdef EWOULDBLOCK
        COMO_DEFINE_CONSTANT(EWOULDBLOCK)
    #endif

    #ifdef ESOCKTNOSUPPORT
        COMO_DEFINE_CONSTANT(ESOCKTNOSUPPORT)
    #endif

    #ifdef EXDEV
        COMO_DEFINE_CONSTANT(EXDEV)
    #endif

    #ifdef WSAEHOSTUNREACH
        COMO_DEFINE_CONSTANT(WSAEHOSTUNREACH)
    #endif

    #ifdef WSAHOST_NOT_FOUND
        COMO_DEFINE_CONSTANT(WSAHOST_NOT_FOUND)
    #endif

    #ifdef WSATYPE_NOT_FOUND
        COMO_DEFINE_CONSTANT(WSATYPE_NOT_FOUND)
    #endif

    #ifdef WSAEINVAL
    { "WSAEINVAL"          , WSAEINVAL},
    #endif

    #ifdef ELOOP
    { "ELOOP"              , ELOOP },
    #endif

    { "EOF"               , COMOEOF },
    { NULL, 0 }
};

COMO_METHOD(como_errno_toString) {
    int ERRNO = duk_get_int(ctx, 0);
    duk_push_string(ctx, strerror(ERRNO));
    return 1;
}


COMO_METHOD(como_errno_translate) {
    int ERRNO = duk_get_int(ctx, 0);
    int sys_error = 0;
    if (ERRNO != 0) {
        sys_error = como_translate_sys_error(ERRNO);
    }
    duk_push_int(ctx, sys_error);
    return 1;
}


static const duk_function_list_entry como_errno_funcs[] = {
    {"toString", como_errno_toString,    1},
    {"translate", como_errno_translate,  1},
    {NULL, NULL,                         0}
};

static int init_binding_errno(duk_context *ctx) {
    duk_push_object(ctx);
    duk_put_function_list(ctx, -1, como_errno_funcs);
    duk_put_number_list(ctx, -1, como_errno_errors);
    return 1;
}
