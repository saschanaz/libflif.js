#ifndef EMBIND_H
#define EMBIND_H
#include <emscripten/bind.h>
#include <emscripten/val.h>
using namespace emscripten;

#include <flif.h>
#include <stdexcept>
#include <vector>

class FLIFImageWrapper {
private:
    FLIF_IMAGE* image;
    std::vector<unsigned char*> bufferStorage;
public:
    FLIFImageWrapper(FLIF_IMAGE* image) {
        this->image = image;
    }
    
    static FLIFImageWrapper* create(uint32_t width, uint32_t height) {
        return new FLIFImageWrapper(flif_create_image(width, height));
    }

    static FLIFImageWrapper* createHDR(uint32_t width, uint32_t height) {
        return new FLIFImageWrapper(flif_create_image_HDR(width, height));
    }

    void clearBuffer() {
        for(unsigned char* p : this->bufferStorage) {
            delete[] p;
        }
        this->bufferStorage.clear();
    }
    
    ~FLIFImageWrapper() {
        this->clearBuffer();
        flif_destroy_image(this->image);
    }

    uint32_t width() const {
        return flif_image_get_width(this->image);
    }

    uint32_t height() const {
        return flif_image_get_height(this->image);
    }

    uint8_t nbChannels() const {
        return flif_image_get_nb_channels(this->image);
    }

    uint8_t depth() const {
        return flif_image_get_depth(this->image);
    }

    uint32_t frameDelay() const {
        return flif_image_get_frame_delay(this->image);
    }

    void setFrameDelay(uint32_t delay) {
        flif_image_set_frame_delay(this->image, delay);
    }

    void writeRowRGBA8(uint32_t row, size_t buffer, size_t bufferSizeBytes) {
        flif_image_write_row_RGBA8(this->image, row, (void*)buffer, bufferSizeBytes);
    }

    val readRowRGBA8(uint32_t row) {
        size_t byteLength = this->width() * 4;
        unsigned char* byteBuffer = new unsigned char[byteLength];

        flif_image_read_row_RGBA8(this->image, row, (void*)byteBuffer, byteLength);
        this->bufferStorage.push_back(byteBuffer);
        return val(typed_memory_view(byteLength, byteBuffer));
    }

    void writeRowRGBA16(uint32_t row, size_t buffer, size_t bufferSizeBytes) {
        flif_image_write_row_RGBA16(this->image, row, (void*)buffer, bufferSizeBytes);
    }

    val readRowRGBA16(uint32_t row) {
        size_t byteLength = this->width() * 8;
        unsigned char* byteBuffer = new unsigned char[byteLength];

        flif_image_read_row_RGBA8(this->image, row, (void*)byteBuffer, byteLength);
        this->bufferStorage.push_back(byteBuffer);
        return val(typed_memory_view(byteLength, byteBuffer));
    }

    FLIF_IMAGE* original() {
        return this->image;
    }
};

class FLIFDecoderWrapper {
private:
    FLIF_DECODER* decoder;
public:
    FLIFDecoderWrapper() {
        this->decoder = flif_create_decoder();
    }

    ~FLIFDecoderWrapper() {
        flif_destroy_decoder(this->decoder);
    }

    void decodeFile(const std::string& filename) {
        const int32_t result = flif_decoder_decode_file(this->decoder, filename.c_str());
        if (result == 0) {
            throw std::runtime_error("decodeFile failed");
        }
    }

    void decodeMemory(size_t buffer, size_t buffer_size_bytes) {
        const int32_t result = flif_decoder_decode_memory(this->decoder, (void*)buffer, buffer_size_bytes);
        if (result == 0) {
            throw std::runtime_error("decodeFile failed");
        }
    }

    size_t numImages() const {
        return flif_decoder_num_images(this->decoder);
    }

    size_t numLoops() const {
        return flif_decoder_num_loops(this->decoder);
    }

    FLIFImageWrapper* getImage(size_t index) {
        return new FLIFImageWrapper(flif_decoder_get_image(this->decoder, index));
    }

    bool abort() {
        return flif_abort_decoder(this->decoder);
    }

    void setCRCCheck(bool crcCheck) {
        flif_decoder_set_crc_check(this->decoder, crcCheck);
    }

    void setQuality(int32_t quality) {
        flif_decoder_set_quality(this->decoder, quality);
    }

    void setScale(uint32_t scale) {
        flif_decoder_set_scale(this->decoder, scale);
    }

    void setResize(uint32_t width, uint32_t height) {
        flif_decoder_set_resize(this->decoder, width, height);
    }

    void setFit(uint32_t width, uint32_t height) {
        flif_decoder_set_fit(this->decoder, width, height);
    }

    void setCallback(size_t callback) {
        flif_decoder_set_callback(this->decoder, reinterpret_cast<uint32_t (*)(int32_t,int64_t)>(callback));
    }

    void setFirstCallbackQuality(int32_t quality) {
        flif_decoder_set_first_callback_quality(this->decoder, quality);
    }
};

class FLIFEncoderWrapper {
private:
    FLIF_ENCODER* encoder;
    std::vector<unsigned char*> bufferStorage;
public:
    FLIFEncoderWrapper() {
        this->encoder = flif_create_encoder();
    }
    
    void clearBuffer() {
        for(unsigned char* p : this->bufferStorage) {
            delete[] p;
        }
        this->bufferStorage.clear();
    }

    ~FLIFEncoderWrapper() {
        flif_destroy_encoder(this->encoder);
    }

    void addImage(FLIFImageWrapper* image) {
        flif_encoder_add_image(this->encoder, image->original());
    }

    void encodeToFile(std::string filename) {
        const int32_t result = flif_encoder_encode_file(this->encoder, filename.c_str());
        if (result == 0) {
            throw std::runtime_error("encodeToFile failed");
        }
    }

    val encodeToMemory() {
        unsigned char* buffer;
        size_t buffer_size_bytes;
        const int32_t result = flif_encoder_encode_memory(this->encoder, (void**)&buffer, &buffer_size_bytes);
        if (result == 0) {
            throw std::runtime_error("encodeToMemory failed");
        }

        this->bufferStorage.push_back(buffer);

        return val(typed_memory_view(buffer_size_bytes, buffer));
    }
};

EMSCRIPTEN_BINDINGS(libflifem) {
    // function("main", &main, allow_raw_pointers());

    class_<FLIFImageWrapper>("FLIFImage")
        .class_function("create", &FLIFImageWrapper::create, allow_raw_pointers())
        .class_function("createHDR", &FLIFImageWrapper::createHDR, allow_raw_pointers())
        .property("width", &FLIFImageWrapper::width)
        .property("height", &FLIFImageWrapper::height)
        .property("nbChannels", &FLIFImageWrapper::nbChannels)
        .property("depth", &FLIFImageWrapper::depth)
        .property("frameDelay", &FLIFImageWrapper::frameDelay, &FLIFImageWrapper::setFrameDelay)
        .function("writeRowRGBA8", &FLIFImageWrapper::writeRowRGBA8)
        .function("readRowRGBA8", &FLIFImageWrapper::readRowRGBA8)
        .function("writeRowRGBA16", &FLIFImageWrapper::writeRowRGBA16)
        .function("readRowRGBA16", &FLIFImageWrapper::readRowRGBA16)
        ;

    class_<FLIFDecoderWrapper>("FLIFDecoder")
        .constructor()
        .function("decodeFile", &FLIFDecoderWrapper::decodeFile)
        .function("decodeMemory", &FLIFDecoderWrapper::decodeMemory)
        .property("numImages", &FLIFDecoderWrapper::numImages)
        .property("numLoops", &FLIFDecoderWrapper::numLoops)
        .function("getImage", &FLIFDecoderWrapper::getImage, allow_raw_pointers())
        .function("abort", &FLIFDecoderWrapper::abort)
        .function("setCRCCheck", &FLIFDecoderWrapper::setCRCCheck)
        .function("setQuality", &FLIFDecoderWrapper::setQuality)
        .function("setScale", &FLIFDecoderWrapper::setScale)
        .function("setResize", &FLIFDecoderWrapper::setResize)
        .function("setFit", &FLIFDecoderWrapper::setFit)
        .function("setCallback", &FLIFDecoderWrapper::setCallback)
        .function("setFirstCallbackQuality", &FLIFDecoderWrapper::setFirstCallbackQuality)
        ;
    
    class_<FLIFEncoderWrapper>("FLIFEncoder")
        .constructor()
        .function("addImage", &FLIFEncoderWrapper::addImage, allow_raw_pointers())
        .function("encodeToFile", &FLIFEncoderWrapper::encodeToFile)
        .function("encodeToMemory", &FLIFEncoderWrapper::encodeToMemory)
        ;
}

#endif