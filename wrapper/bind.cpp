#ifndef EMBIND_H
#define EMBIND_H
#include <emscripten/bind.h>
using namespace emscripten;

#include <flif-interface-private.hpp>

void setFlifCallback(FLIF_DECODER* decoder, size_t callback) {
    decoder->callback = (void*)callback;
}

void clearFlifCallback(FLIF_DECODER* decoder) {
    decoder->callback = NULL;
}

EMSCRIPTEN_BINDINGS(libflifem) {
    // function("main", &main, allow_raw_pointers());

    // class_<FlifDecoderWrapper>("FLIFDecoder")
    //     .constructor()
    //     ;

    class_<FLIF_DECODER>("FLIFDecoder")
        .constructor()
        .function("decodeFile", &FLIF_DECODER::decode_file, allow_raw_pointers())
        .function("decodeMemory", &FLIF_DECODER::decode_memory, allow_raw_pointers())
        .function("abort", &FLIF_DECODER::abort)
        .function("numImages", &FLIF_DECODER::num_images)
        .function("numLoops", &FLIF_DECODER::num_loops)
        .function("getImage", &FLIF_DECODER::get_image, allow_raw_pointers())
        .property("quality", &FLIF_DECODER::quality)
        .property("scale", &FLIF_DECODER::scale)
        // .property("callback", &FLIF_DECODER::callback, allow_raw_pointers()) // Emscripten #4523
        .property("firstQuality", &FLIF_DECODER::first_quality)
        .property("rw", &FLIF_DECODER::rw)
        .property("rh", &FLIF_DECODER::rh)
        .property("crc_check", &FLIF_DECODER::crc_check)
        .property("fit", &FLIF_DECODER::fit)
        ;
    
    function("setFLIFCallback", &setFlifCallback, allow_raw_pointers());
    function("clearFLIFCallback", &clearFlifCallback, allow_raw_pointers());
}

#endif