package router

import (
	"net/http"
	"strings"
	"embed"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

// ThemeAssets holds the embedded frontend assets for both themes.
type ThemeAssets struct {
	DefaultBuildFS   embed.FS
	DefaultIndexPage []byte
	ClassicBuildFS   embed.FS
	ClassicIndexPage []byte
}

func SetWebRouter(router *gin.Engine, assets ThemeAssets) {
	defaultFS := common.EmbedFolder(assets.DefaultBuildFS, "web/default/dist")
	classicFS := common.EmbedFolder(assets.ClassicBuildFS, "web/classic/dist")

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	
	// Custom static file handler to serve logo.png from embedded dist directories
	router.GET("/logo.png", func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if common.GetTheme() == "classic" {
			data, err := classicFS.Open("web/classic/dist/logo.png")
			if err != nil {
				c.Status(http.StatusNotFound)
				return
			}
			defer data.Close()
			stat, err := data.Stat()
			if err != nil {
				c.Status(http.StatusNotFound)
				return
			}
			c.DataFromReader(http.StatusOK, stat.Size(), "image/png", data, nil)
		} else {
			data, err := defaultFS.Open("web/default/dist/logo.png")
			if err != nil {
				c.Status(http.StatusNotFound)
				return
			}
			defer data.Close()
			stat, err := data.Stat()
			if err != nil {
				c.Status(http.StatusNotFound)
				return
			}
			c.DataFromReader(http.StatusOK, stat.Size(), "image/png", data, nil)
		}
	})
	
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		if common.GetTheme() == "classic" {
			c.Data(http.StatusOK, "text/html; charset=utf-8", assets.ClassicIndexPage)
		} else {
			c.Data(http.StatusOK, "text/html; charset=utf-8", assets.DefaultIndexPage)
		}
	})
}