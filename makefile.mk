# this makefile should be stored in pictures folder

# sub Directory to store the thumbnails
THUMB_DIR = mini

# Thumbnail size
SIZE = 300x300

# expected parameters :
# LOGIN
# PASSWORD
# FTPADRESS

# List of image files
IMAGES = $(wildcard ./*.jpg ./*.jpeg)
# List of thumbnail files
THUMBNAILS = $(patsubst %.jpg, $(THUMB_DIR)/%.jpg, $(filter %.jpg,$(IMAGES))) \
             $(patsubst %.jpeg, $(THUMB_DIR)/%.jpeg, $(filter %.jpeg,$(IMAGES)))

Makefile_common_help.mk:
	@echo "retrieving latest version of $@"
	curl -s https://raw.githubusercontent.com/nbossard/makefile_tools/refs/heads/main/$@ -o $@

include Makefile_common_help.mk

# Default target
.PHONY: all
all: $(THUMBNAILS)  ## Generate or update all thumbnails
	@echo "Done"

# Rule to create the thumbnails directory
$(THUMB_DIR):
	mkdir -p $(THUMB_DIR)

# Rule to generate thumbnails
$(THUMB_DIR)/%.jpg: %.jpg | $(THUMB_DIR)
	magick $< -resize $(SIZE) $@

$(THUMB_DIR)/%.jpeg: %.jpeg | $(THUMB_DIR)
	magick $< -resize $(SIZE) $@
	magick $< -resize $(SIZE) $@

# Clean target to remove thumbnails
.PHONY: clean
clean:
	rm -rf $(THUMB_DIR)

.PHONY: upload_pictures
upload_pictures: guard-LOGIN \
                 guard-PASSWORD \
                 guard-FTPADRESS \
                 ## Download all pictures from ftp server
	lftp -u $(LOGIN),$(PASSWORD) -e "mirror -R --no-empty-dirs --only-newer . www/photos; quit" $(FTPADRESS)

.PHONY: download_files
download_pictures: guard-LOGIN \
                   guard-PASSWORD \
                   guard-FTPADRESS \
                   ## Download all pictures from ftp server
	lftp -u $(LOGIN),$(PASSWORD) -e "mirror /www/photos .; quit" $(FTPADRESS)

.PHONY: upload_thumbnails
upload_thumbnails: guard-LOGIN \
                   guard-PASSWORD \
                   guard-FTPADRESS \
                   ## Upload all files to ftp server
	lftp -u $(LOGIN),$(PASSWORD) -e "mirror -v -R ./$(THUMB_DIR) www/photos/$(THUMB_DIR); quit" $(FTPADRESS)

source_env: ## load settings from .env file
	. .env

## Raises an error if the stem if not a defined variable
guard-%:
	@#$(or ${$*}, $(error $* is not set))
