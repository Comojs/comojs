#ifndef _COMO_ERRNO_H
#define _COMO_ERRNO_H

#define COMOEOF -4095

#if !defined(ECANCELED) && defined(_WIN32)
#define ECANCELED  16000
#endif

#if !defined(ECHARSET) && defined(_WIN32)
#define ECHARSET  16001
#endif

#if !defined(EHOSTUNREACH) && defined(_WIN32)
#define EHOSTUNREACH  16002
#endif

#if !defined(ERROR_SYMLINK_NOT_SUPPORTED) && defined(_WIN32)
#define ERROR_SYMLINK_NOT_SUPPORTED  16003
#endif

#if !defined(ELOOP) && defined(_WIN32)
#define ELOOP  16004
#endif

#if !defined(EMSGSIZE) && defined(_WIN32)
#define EMSGSIZE  16005
#endif

#if !defined(ENETUNREACH) && defined(_WIN32)
#define ENETUNREACH  16006
#endif

#if !defined(ENOTSUP) && defined(_WIN32)
#define ENOTSUP  16007
#endif

#if !defined(ETIMEDOUT) && defined(_WIN32)
#define ETIMEDOUT  16008
#endif

#if !defined(UNKNOWN) && defined(_WIN32)
#define UNKNOWN  16009
#endif

#if !defined(EADDRINUSE) && defined(_WIN32)
#define EADDRINUSE WSAEADDRINUSE
#endif

#if !defined(ENOTSOCK) && defined(_WIN32)
# define ENOTSOCK WSAENOTSOCK
#endif

#if !defined(ECONNRESET) && defined(_WIN32)
# define ECONNRESET WSAECONNRESET
#endif

#if !defined(EWOULDBLOCK) && defined(_WIN32)
# define EWOULDBLOCK  WSAEWOULDBLOCK
#endif

#if !defined(ECONNABORTED) && defined(_WIN32)
# define ECONNABORTED  WSAECONNABORTED
#endif

#if !defined(EAFNOSUPPORT) && defined(_WIN32)
#define EAFNOSUPPORT WSAEAFNOSUPPORT
#endif

#if !defined(EACCES) && defined(_WIN32)
#define EACCES WSAEACCES
#endif

#if !defined(EMFILE) && defined(_WIN32)
#define EMFILE WSAEMFILE
#endif

#if !defined(ESOCKTNOSUPPORT) && defined(_WIN32)
#define ESOCKTNOSUPPORT WSAESOCKTNOSUPPORT
#endif

#if !defined(EPROTONOSUPPORT) && defined(_WIN32)
#define EPROTONOSUPPORT WSAEPROTONOSUPPORT
#endif

#if !defined(EADDRNOTAVAIL) && defined(_WIN32)
#define EADDRNOTAVAIL WSAEADDRNOTAVAIL
#endif

#if !defined(ECONNREFUSED) && defined(_WIN32)
#define ECONNREFUSED WSAECONNREFUSED
#endif

#if !defined(EINPROGRESS) && defined(_WIN32)
#define EINPROGRESS WSAEINPROGRESS
#endif

#if !defined(EALREADY) && defined(_WIN32)
#define EALREADY WSAEALREADY
#endif

#if !defined(EISCONN) && defined(_WIN32)
#define EISCONN WSAEISCONN
#endif

#if !defined(ENOBUFS) && defined(_WIN32)
#define ENOBUFS WSAENOBUFS
#endif

#if !defined(ENOTCONN) && defined(_WIN32)
#define ENOTCONN  WSAENOTCONN
#endif

#ifdef _WIN32
#define SOCKEINTR WSAEINTR
#else
#define SOCKEINTR EINTR
#endif

#endif /* _COMO_ERRNO_H */
