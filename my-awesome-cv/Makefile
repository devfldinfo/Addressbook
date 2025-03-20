.PHONY: cv

CC = xelatex
CV_DIR = cv
CV_SRCS = cv/sections.tex
PD_DIR = cv/personal_data
PD_SRCS = $(shell find $(PD_DIR) -name '*.tex')

cv.pdf: $(CV_DIR)/cv.tex $(CV_SRCS) $(PD_SRCS)
	$(CC) -output-directory=$(CV_DIR) $<

clean:
	rm -rf $(CV_DIR)/*.pdf
