/**
 * \file ssl_ciphersuites.h
 *
 * \brief SSL Ciphersuites for mbed TLS
 *
 *  Copyright (C) 2006-2013, ARM Limited, All Rights Reserved
 *
 *  This file is part of mbed TLS (https://tls.mbed.org)
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
#ifndef MBEDTLS_SSL_CIPHERSUITES_H
#define MBEDTLS_SSL_CIPHERSUITES_H

#include "pk.h"
#include "cipher.h"
#include "md.h"

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Supported ciphersuites (Official IANA names)
 */
#define MBEDTLS_TLS_RSA_WITH_NULL_MD5                    0x01   /**< Weak! */
#define MBEDTLS_TLS_RSA_WITH_NULL_SHA                    0x02   /**< Weak! */

#define MBEDTLS_TLS_RSA_WITH_RC4_128_MD5                 0x04
#define MBEDTLS_TLS_RSA_WITH_RC4_128_SHA                 0x05
#define MBEDTLS_TLS_RSA_WITH_DES_CBC_SHA                 0x09   /**< Weak! Not in TLS 1.2 */

#define MBEDTLS_TLS_RSA_WITH_3DES_EDE_CBC_SHA            0x0A

#define MBEDTLS_TLS_DHE_RSA_WITH_DES_CBC_SHA             0x15   /**< Weak! Not in TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA        0x16

#define MBEDTLS_TLS_PSK_WITH_NULL_SHA                    0x2C   /**< Weak! */
#define MBEDTLS_TLS_DHE_PSK_WITH_NULL_SHA                0x2D   /**< Weak! */
#define MBEDTLS_TLS_RSA_PSK_WITH_NULL_SHA                0x2E   /**< Weak! */
#define MBEDTLS_TLS_RSA_WITH_AES_128_CBC_SHA             0x2F

#define MBEDTLS_TLS_DHE_RSA_WITH_AES_128_CBC_SHA         0x33
#define MBEDTLS_TLS_RSA_WITH_AES_256_CBC_SHA             0x35
#define MBEDTLS_TLS_DHE_RSA_WITH_AES_256_CBC_SHA         0x39

#define MBEDTLS_TLS_RSA_WITH_NULL_SHA256                 0x3B   /**< Weak! */
#define MBEDTLS_TLS_RSA_WITH_AES_128_CBC_SHA256          0x3C   /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_WITH_AES_256_CBC_SHA256          0x3D   /**< TLS 1.2 */

#define MBEDTLS_TLS_RSA_WITH_CAMELLIA_128_CBC_SHA        0x41
#define MBEDTLS_TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA    0x45

#define MBEDTLS_TLS_DHE_RSA_WITH_AES_128_CBC_SHA256      0x67   /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_AES_256_CBC_SHA256      0x6B   /**< TLS 1.2 */

#define MBEDTLS_TLS_RSA_WITH_CAMELLIA_256_CBC_SHA        0x84
#define MBEDTLS_TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA    0x88

#define MBEDTLS_TLS_PSK_WITH_RC4_128_SHA                 0x8A
#define MBEDTLS_TLS_PSK_WITH_3DES_EDE_CBC_SHA            0x8B
#define MBEDTLS_TLS_PSK_WITH_AES_128_CBC_SHA             0x8C
#define MBEDTLS_TLS_PSK_WITH_AES_256_CBC_SHA             0x8D

#define MBEDTLS_TLS_DHE_PSK_WITH_RC4_128_SHA             0x8E
#define MBEDTLS_TLS_DHE_PSK_WITH_3DES_EDE_CBC_SHA        0x8F
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_128_CBC_SHA         0x90
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_256_CBC_SHA         0x91

#define MBEDTLS_TLS_RSA_PSK_WITH_RC4_128_SHA             0x92
#define MBEDTLS_TLS_RSA_PSK_WITH_3DES_EDE_CBC_SHA        0x93
#define MBEDTLS_TLS_RSA_PSK_WITH_AES_128_CBC_SHA         0x94
#define MBEDTLS_TLS_RSA_PSK_WITH_AES_256_CBC_SHA         0x95

#define MBEDTLS_TLS_RSA_WITH_AES_128_GCM_SHA256          0x9C   /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_WITH_AES_256_GCM_SHA384          0x9D   /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_AES_128_GCM_SHA256      0x9E   /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_AES_256_GCM_SHA384      0x9F   /**< TLS 1.2 */

#define MBEDTLS_TLS_PSK_WITH_AES_128_GCM_SHA256          0xA8   /**< TLS 1.2 */
#define MBEDTLS_TLS_PSK_WITH_AES_256_GCM_SHA384          0xA9   /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_128_GCM_SHA256      0xAA   /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_256_GCM_SHA384      0xAB   /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_PSK_WITH_AES_128_GCM_SHA256      0xAC   /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_PSK_WITH_AES_256_GCM_SHA384      0xAD   /**< TLS 1.2 */

#define MBEDTLS_TLS_PSK_WITH_AES_128_CBC_SHA256          0xAE
#define MBEDTLS_TLS_PSK_WITH_AES_256_CBC_SHA384          0xAF
#define MBEDTLS_TLS_PSK_WITH_NULL_SHA256                 0xB0   /**< Weak! */
#define MBEDTLS_TLS_PSK_WITH_NULL_SHA384                 0xB1   /**< Weak! */

#define MBEDTLS_TLS_DHE_PSK_WITH_AES_128_CBC_SHA256      0xB2
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_256_CBC_SHA384      0xB3
#define MBEDTLS_TLS_DHE_PSK_WITH_NULL_SHA256             0xB4   /**< Weak! */
#define MBEDTLS_TLS_DHE_PSK_WITH_NULL_SHA384             0xB5   /**< Weak! */

#define MBEDTLS_TLS_RSA_PSK_WITH_AES_128_CBC_SHA256      0xB6
#define MBEDTLS_TLS_RSA_PSK_WITH_AES_256_CBC_SHA384      0xB7
#define MBEDTLS_TLS_RSA_PSK_WITH_NULL_SHA256             0xB8   /**< Weak! */
#define MBEDTLS_TLS_RSA_PSK_WITH_NULL_SHA384             0xB9   /**< Weak! */

#define MBEDTLS_TLS_RSA_WITH_CAMELLIA_128_CBC_SHA256     0xBA   /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA256 0xBE   /**< TLS 1.2 */

#define MBEDTLS_TLS_RSA_WITH_CAMELLIA_256_CBC_SHA256     0xC0   /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA256 0xC4   /**< TLS 1.2 */

#define MBEDTLS_TLS_ECDH_ECDSA_WITH_NULL_SHA             0xC001 /**< Weak! */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_RC4_128_SHA          0xC002 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA     0xC003 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA      0xC004 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA      0xC005 /**< Not in SSL3! */

#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_NULL_SHA            0xC006 /**< Weak! */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_RC4_128_SHA         0xC007 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA    0xC008 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA     0xC009 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA     0xC00A /**< Not in SSL3! */

#define MBEDTLS_TLS_ECDH_RSA_WITH_NULL_SHA               0xC00B /**< Weak! */
#define MBEDTLS_TLS_ECDH_RSA_WITH_RC4_128_SHA            0xC00C /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA       0xC00D /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_RSA_WITH_AES_128_CBC_SHA        0xC00E /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_RSA_WITH_AES_256_CBC_SHA        0xC00F /**< Not in SSL3! */

#define MBEDTLS_TLS_ECDHE_RSA_WITH_NULL_SHA              0xC010 /**< Weak! */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_RC4_128_SHA           0xC011 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA      0xC012 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA       0xC013 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA       0xC014 /**< Not in SSL3! */

#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256  0xC023 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384  0xC024 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA256   0xC025 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA384   0xC026 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256    0xC027 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384    0xC028 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_RSA_WITH_AES_128_CBC_SHA256     0xC029 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_RSA_WITH_AES_256_CBC_SHA384     0xC02A /**< TLS 1.2 */

#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256  0xC02B /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384  0xC02C /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256   0xC02D /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384   0xC02E /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256    0xC02F /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384    0xC030 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256     0xC031 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384     0xC032 /**< TLS 1.2 */

#define MBEDTLS_TLS_ECDHE_PSK_WITH_RC4_128_SHA           0xC033 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_3DES_EDE_CBC_SHA      0xC034 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA       0xC035 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_AES_256_CBC_SHA       0xC036 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA256    0xC037 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_AES_256_CBC_SHA384    0xC038 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_NULL_SHA              0xC039 /**< Weak! No SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_NULL_SHA256           0xC03A /**< Weak! No SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_NULL_SHA384           0xC03B /**< Weak! No SSL3! */

#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_CAMELLIA_128_CBC_SHA256 0xC072 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_CAMELLIA_256_CBC_SHA384 0xC073 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_CAMELLIA_128_CBC_SHA256  0xC074 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_CAMELLIA_256_CBC_SHA384  0xC075 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_CAMELLIA_128_CBC_SHA256   0xC076 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_CAMELLIA_256_CBC_SHA384   0xC077 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_RSA_WITH_CAMELLIA_128_CBC_SHA256    0xC078 /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDH_RSA_WITH_CAMELLIA_256_CBC_SHA384    0xC079 /**< Not in SSL3! */

#define MBEDTLS_TLS_RSA_WITH_CAMELLIA_128_GCM_SHA256         0xC07A /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_WITH_CAMELLIA_256_GCM_SHA384         0xC07B /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_CAMELLIA_128_GCM_SHA256     0xC07C /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_CAMELLIA_256_GCM_SHA384     0xC07D /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_CAMELLIA_128_GCM_SHA256 0xC086 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_CAMELLIA_256_GCM_SHA384 0xC087 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_CAMELLIA_128_GCM_SHA256  0xC088 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_ECDSA_WITH_CAMELLIA_256_GCM_SHA384  0xC089 /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_CAMELLIA_128_GCM_SHA256   0xC08A /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_RSA_WITH_CAMELLIA_256_GCM_SHA384   0xC08B /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_RSA_WITH_CAMELLIA_128_GCM_SHA256    0xC08C /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDH_RSA_WITH_CAMELLIA_256_GCM_SHA384    0xC08D /**< TLS 1.2 */

#define MBEDTLS_TLS_PSK_WITH_CAMELLIA_128_GCM_SHA256       0xC08E /**< TLS 1.2 */
#define MBEDTLS_TLS_PSK_WITH_CAMELLIA_256_GCM_SHA384       0xC08F /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_PSK_WITH_CAMELLIA_128_GCM_SHA256   0xC090 /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_PSK_WITH_CAMELLIA_256_GCM_SHA384   0xC091 /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_PSK_WITH_CAMELLIA_128_GCM_SHA256   0xC092 /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_PSK_WITH_CAMELLIA_256_GCM_SHA384   0xC093 /**< TLS 1.2 */

#define MBEDTLS_TLS_PSK_WITH_CAMELLIA_128_CBC_SHA256       0xC094
#define MBEDTLS_TLS_PSK_WITH_CAMELLIA_256_CBC_SHA384       0xC095
#define MBEDTLS_TLS_DHE_PSK_WITH_CAMELLIA_128_CBC_SHA256   0xC096
#define MBEDTLS_TLS_DHE_PSK_WITH_CAMELLIA_256_CBC_SHA384   0xC097
#define MBEDTLS_TLS_RSA_PSK_WITH_CAMELLIA_128_CBC_SHA256   0xC098
#define MBEDTLS_TLS_RSA_PSK_WITH_CAMELLIA_256_CBC_SHA384   0xC099
#define MBEDTLS_TLS_ECDHE_PSK_WITH_CAMELLIA_128_CBC_SHA256 0xC09A /**< Not in SSL3! */
#define MBEDTLS_TLS_ECDHE_PSK_WITH_CAMELLIA_256_CBC_SHA384 0xC09B /**< Not in SSL3! */

#define MBEDTLS_TLS_RSA_WITH_AES_128_CCM                0xC09C  /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_WITH_AES_256_CCM                0xC09D  /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_AES_128_CCM            0xC09E  /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_AES_256_CCM            0xC09F  /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_WITH_AES_128_CCM_8              0xC0A0  /**< TLS 1.2 */
#define MBEDTLS_TLS_RSA_WITH_AES_256_CCM_8              0xC0A1  /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_AES_128_CCM_8          0xC0A2  /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_RSA_WITH_AES_256_CCM_8          0xC0A3  /**< TLS 1.2 */
#define MBEDTLS_TLS_PSK_WITH_AES_128_CCM                0xC0A4  /**< TLS 1.2 */
#define MBEDTLS_TLS_PSK_WITH_AES_256_CCM                0xC0A5  /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_128_CCM            0xC0A6  /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_256_CCM            0xC0A7  /**< TLS 1.2 */
#define MBEDTLS_TLS_PSK_WITH_AES_128_CCM_8              0xC0A8  /**< TLS 1.2 */
#define MBEDTLS_TLS_PSK_WITH_AES_256_CCM_8              0xC0A9  /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_128_CCM_8          0xC0AA  /**< TLS 1.2 */
#define MBEDTLS_TLS_DHE_PSK_WITH_AES_256_CCM_8          0xC0AB  /**< TLS 1.2 */
/* The last two are named with PSK_DHE in the RFC, which looks like a typo */

#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_128_CCM        0xC0AC  /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_256_CCM        0xC0AD  /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_128_CCM_8      0xC0AE  /**< TLS 1.2 */
#define MBEDTLS_TLS_ECDHE_ECDSA_WITH_AES_256_CCM_8      0xC0AF  /**< TLS 1.2 */

/* Reminder: update mbedtls_ssl_premaster_secret when adding a new key exchange.
 * Reminder: update MBEDTLS_KEY_EXCHANGE__WITH_CERT__ENABLED below.
 */
typedef enum {
    MBEDTLS_KEY_EXCHANGE_NONE = 0,
    MBEDTLS_KEY_EXCHANGE_RSA,
    MBEDTLS_KEY_EXCHANGE_DHE_RSA,
    MBEDTLS_KEY_EXCHANGE_ECDHE_RSA,
    MBEDTLS_KEY_EXCHANGE_ECDHE_ECDSA,
    MBEDTLS_KEY_EXCHANGE_PSK,
    MBEDTLS_KEY_EXCHANGE_DHE_PSK,
    MBEDTLS_KEY_EXCHANGE_RSA_PSK,
    MBEDTLS_KEY_EXCHANGE_ECDHE_PSK,
    MBEDTLS_KEY_EXCHANGE_ECDH_RSA,
    MBEDTLS_KEY_EXCHANGE_ECDH_ECDSA,
} mbedtls_key_exchange_type_t;

#if defined(MBEDTLS_KEY_EXCHANGE_RSA_ENABLED)          || \
    defined(MBEDTLS_KEY_EXCHANGE_DHE_RSA_ENABLED)      || \
    defined(MBEDTLS_KEY_EXCHANGE_ECDHE_RSA_ENABLED)    || \
    defined(MBEDTLS_KEY_EXCHANGE_ECDHE_ECDSA_ENABLED)  || \
    defined(MBEDTLS_KEY_EXCHANGE_RSA_PSK_ENABLED)      || \
    defined(MBEDTLS_KEY_EXCHANGE_ECDHE_PSK_ENABLED)    || \
    defined(MBEDTLS_KEY_EXCHANGE_ECDH_RSA_ENABLED)     || \
    defined(MBEDTLS_KEY_EXCHANGE_ECDH_ECDSA_ENABLED)
#define MBEDTLS_KEY_EXCHANGE__WITH_CERT__ENABLED
#endif

typedef struct mbedtls_ssl_ciphersuite_t mbedtls_ssl_ciphersuite_t;

#define MBEDTLS_CIPHERSUITE_WEAK       0x01    /**< Weak ciphersuite flag  */
#define MBEDTLS_CIPHERSUITE_SHORT_TAG  0x02    /**< Short authentication tag,
                                                     eg for CCM_8 */
#define MBEDTLS_CIPHERSUITE_NODTLS     0x04    /**< Can't be used with DTLS */

/**
 * \brief   This structure is used for storing ciphersuite information
 */
struct mbedtls_ssl_ciphersuite_t
{
    int id;
    const char * name;

    mbedtls_cipher_type_t cipher;
    mbedtls_md_type_t mac;
    mbedtls_key_exchange_type_t key_exchange;

    int min_major_ver;
    int min_minor_ver;
    int max_major_ver;
    int max_minor_ver;

    unsigned char flags;
};

const int *mbedtls_ssl_list_ciphersuites( void );

const mbedtls_ssl_ciphersuite_t *mbedtls_ssl_ciphersuite_from_string( const char *ciphersuite_name );
const mbedtls_ssl_ciphersuite_t *mbedtls_ssl_ciphersuite_from_id( int ciphersuite_id );

#if defined(MBEDTLS_PK_C)
mbedtls_pk_type_t mbedtls_ssl_get_ciphersuite_sig_pk_alg( const mbedtls_ssl_ciphersuite_t *info );
#endif

int mbedtls_ssl_ciphersuite_uses_ec( const mbedtls_ssl_ciphersuite_t *info );
int mbedtls_ssl_ciphersuite_uses_psk( const mbedtls_ssl_ciphersuite_t *info );

#ifdef __cplusplus
}
#endif

#endif /* ssl_ciphersuites.h */
